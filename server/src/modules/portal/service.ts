import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { sendEmail, magicLinkEmailTemplate } from '../../lib/email';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/env';
import { io } from '../../server';
import { logActivity } from '../../events/activity';

const PORTAL_SESSION_DAYS = 90;

function portalSessionExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + PORTAL_SESSION_DAYS);
  return d;
}

// ── Generate / Revoke portal token on Project ──────────────────────────────

export async function generatePortalToken(projectId: string, actorId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });
  if (!project) throw new AppError(404, 'Project not found');

  const actor = project.members.find((m) => m.userId === actorId);
  if (!actor || actor.role === 'CLIENT') {
    throw new AppError(403, 'Only team members can generate portal tokens');
  }

  // If there's already a token, return it
  if (project.clientPortalToken) {
    return { portalToken: project.clientPortalToken, projectId };
  }

  const token = crypto.randomBytes(24).toString('base64url');

  await prisma.project.update({
    where: { id: projectId },
    data: { clientPortalToken: token },
  });

  return { portalToken: token, projectId };
}

export async function revokePortalToken(projectId: string, actorId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });
  if (!project) throw new AppError(404, 'Project not found');

  const actor = project.members.find((m) => m.userId === actorId);
  if (!actor || actor.role === 'CLIENT') {
    throw new AppError(403, 'Only team members can revoke portal tokens');
  }

  await prisma.$transaction([
    prisma.portalSession.deleteMany({ where: { projectId } }),
    prisma.project.update({
      where: { id: projectId },
      data: { clientPortalToken: null },
    }),
  ]);

  return { message: 'Portal token revoked and all sessions invalidated' };
}

// ── Client invite acceptance (zero-friction first access) ───────────────────

/**
 * Accept a CLIENT project invite via the emailed link. Provisions a passwordless
 * user if needed, joins them as CLIENT, ensures a portal token exists, and returns
 * a portal session so the client lands directly on their dashboard — no signup.
 */
export async function acceptClientInvite(inviteToken: string) {
  const invite = await prisma.inviteToken.findUnique({ where: { token: inviteToken } });

  if (!invite) throw new AppError(400, 'This invite link is invalid.');
  if (!invite.projectId || invite.role !== 'CLIENT') {
    throw new AppError(400, 'This is not a client invite.');
  }
  // Idempotent: re-clicking an already-accepted link (or a StrictMode double-call)
  // should re-issue a session, not error. Only a never-accepted invite can expire.
  const firstAccept = !invite.acceptedAt;
  if (firstAccept && invite.expiresAt < new Date()) {
    throw new AppError(400, 'This invite link has expired. Ask your team to resend it.');
  }

  const project = await prisma.project.findUnique({
    where: { id: invite.projectId },
    select: { id: true, name: true, workspaceId: true, clientPortalToken: true },
  });
  if (!project) throw new AppError(404, 'Project not found');

  const normalizedEmail = invite.email.toLowerCase().trim();

  // Find or auto-provision a passwordless user for this client.
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (!user) {
    const nameFromEmail = normalizedEmail.split('@')[0] || 'Client';
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: nameFromEmail,
        passwordHash: null,
        emailVerified: true, // clicking the emailed invite proves email ownership
      },
      select: { id: true },
    });
  }
  const userId = user.id;

  // Ensure a portal token exists so the re-access landing page works later.
  const portalToken = project.clientPortalToken ?? crypto.randomBytes(24).toString('base64url');

  const sessionTokenValue = crypto.randomBytes(24).toString('base64url');

  const txOps: any[] = [
    prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId } },
      update: { role: 'CLIENT' },
      create: { projectId: project.id, userId, role: 'CLIENT' },
    }),
    prisma.inviteToken.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
    prisma.portalSession.upsert({
      where: { email_projectId: { email: normalizedEmail, projectId: project.id } },
      update: { token: sessionTokenValue, userId, expiresAt: portalSessionExpiry(), lastActiveAt: new Date() },
      create: { email: normalizedEmail, projectId: project.id, userId, token: sessionTokenValue, expiresAt: portalSessionExpiry() },
    }),
  ];

  if (!project.clientPortalToken) {
    txOps.push(
      prisma.project.update({ where: { id: project.id }, data: { clientPortalToken: portalToken } }),
    );
  }

  // Ensure workspace membership exists (clients need it to resolve the workspace layout).
  const existingWsMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: project.workspaceId, userId } },
  });
  if (!existingWsMember) {
    txOps.push(
      prisma.workspaceMember.create({
        data: { workspaceId: project.workspaceId, userId, role: 'MEMBER' },
      }),
    );
  }

  await prisma.$transaction(txOps);

  // Only notify/log on the first acceptance — not on every re-click of the link.
  if (firstAccept) {
    if (invite.createdById) {
      await prisma.notification.create({
        data: {
          recipientId: invite.createdById,
          actorId: userId,
          type: 'INVITE_ACCEPTED',
          meta: { projectId: project.id },
        },
      });
      io.to(`user:${invite.createdById}`).emit('notification:new');
    }

    await logActivity({
      projectId: project.id,
      actorId: userId,
      type: 'MEMBER_JOINED',
      clientVisible: true,
      meta: { memberName: normalizedEmail.split('@')[0], role: 'CLIENT' },
    });
  }

  return { sessionToken: sessionTokenValue, projectId: project.id };
}

// ── Optional password upgrade for portal users ──────────────────────────────

export async function setPortalPassword(userId: string, password: string) {
  if (!password || password.length < 8) {
    throw new AppError(400, 'Password must be at least 8 characters.');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, emailVerified: true },
  });
  return { message: 'Password set. You can now log in with your email and password.' };
}

// ── Magic link request ─────────────────────────────────────────────────────

export async function requestMagicLink(portalToken: string, email: string) {
  const normalizedEmail = email.toLowerCase().trim();

  // Find project by portal token
  const project = await prisma.project.findUnique({
    where: { clientPortalToken: portalToken },
    select: { id: true, name: true, workspaceId: true },
  });
  if (!project) throw new AppError(404, 'Invalid portal link');

  // Check that this email has CLIENT membership
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (!user) throw new AppError(403, 'No access to this project');

  let member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
  });

  // Auto-accept a pending CLIENT invite if the user hasn't formally accepted yet
  if (!member || member.role !== 'CLIENT') {
    const pendingInvite = await prisma.inviteToken.findFirst({
      where: {
        email: normalizedEmail,
        projectId: project.id,
        role: 'CLIENT',
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (pendingInvite) {
      const txOps: any[] = [
        prisma.projectMember.upsert({
          where: { projectId_userId: { projectId: project.id, userId: user.id } },
          update: { role: 'CLIENT' },
          create: { projectId: project.id, userId: user.id, role: 'CLIENT' },
        }),
        prisma.inviteToken.update({ where: { id: pendingInvite.id }, data: { acceptedAt: new Date() } }),
      ];

      // Ensure workspace membership exists
      const existingWsMember = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: project.workspaceId, userId: user.id } },
      });
      if (!existingWsMember) {
        txOps.push(
          prisma.workspaceMember.create({
            data: { workspaceId: project.workspaceId, userId: user.id, role: 'MEMBER' },
          }),
        );
      }

      await prisma.$transaction(txOps);

      member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: project.id, userId: user.id } },
      });
    }
  }

  if (!member || member.role !== 'CLIENT') {
    throw new AppError(403, 'No client access to this project');
  }

  // Upsert portal session (always regenerate token so the latest magic link works)
  const newToken = crypto.randomBytes(24).toString('base64url');
  const session = await prisma.portalSession.upsert({
    where: { email_projectId: { email: normalizedEmail, projectId: project.id } },
    update: {
      token: newToken,
      expiresAt: portalSessionExpiry(),
      lastActiveAt: new Date(),
    },
    create: {
      email: normalizedEmail,
      projectId: project.id,
      userId: user.id,
      token: newToken,
      expiresAt: portalSessionExpiry(),
    },
  });

  // Send magic link email
  const magicUrl = `${env.CLIENT_URL}/portal/session/${session.token}`;
  await sendEmail({
    to: normalizedEmail,
    subject: `Your portal access link for ${project.name}`,
    html: magicLinkEmailTemplate(project.name, magicUrl),
  });

  return { message: 'Magic link sent. Check your email.' };
}

// ── Session validation ─────────────────────────────────────────────────────

export async function validateSession(sessionToken: string) {
  const session = await prisma.portalSession.findUnique({
    where: { token: sessionToken },
    include: {
      project: { select: { id: true, name: true, description: true, workspaceId: true } },
    },
  });

  if (!session) throw new AppError(404, 'Invalid session token');
  if (session.expiresAt < new Date()) {
    throw new AppError(401, 'Session expired. Request a new magic link.');
  }

  // Refresh session
  const newExpiry = portalSessionExpiry();
  await prisma.portalSession.update({
    where: { id: session.id },
    data: { lastActiveAt: new Date(), expiresAt: newExpiry },
  });

  return {
    sessionToken: session.token,
    email: session.email,
    userId: session.userId,
    projectId: session.projectId,
    project: session.project,
  };
}

// ── Get project info by portal token (public, for landing page) ────────────

export async function getPortalProject(portalToken: string) {
  const project = await prisma.project.findUnique({
    where: { clientPortalToken: portalToken },
    select: { id: true, name: true, description: true },
  });
  if (!project) throw new AppError(404, 'Invalid portal link');
  return project;
}

// ── Multi-project: get all projects where user is CLIENT ───────────────────

export async function getClientProjects(userId: string) {
  const memberships = await prisma.projectMember.findMany({
    where: { userId, role: 'CLIENT' },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          _count: { select: { channels: true, files: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map((m) => m.project);
}


