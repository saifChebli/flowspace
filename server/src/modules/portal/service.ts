import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { sendEmail } from '../../lib/email';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/env';

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

// ── Magic link request ─────────────────────────────────────────────────────

export async function requestMagicLink(portalToken: string, email: string) {
  const normalizedEmail = email.toLowerCase().trim();

  // Find project by portal token
  const project = await prisma.project.findUnique({
    where: { clientPortalToken: portalToken },
    select: { id: true, name: true },
  });
  if (!project) throw new AppError(404, 'Invalid portal link');

  // Check that this email has CLIENT membership
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (!user) throw new AppError(403, 'No access to this project');

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: project.id, userId: user.id } },
  });
  if (!member || member.role !== 'CLIENT') {
    throw new AppError(403, 'No client access to this project');
  }

  // Upsert portal session
  const session = await prisma.portalSession.upsert({
    where: { email_projectId: { email: normalizedEmail, projectId: project.id } },
    update: {
      expiresAt: portalSessionExpiry(),
      lastActiveAt: new Date(),
    },
    create: {
      email: normalizedEmail,
      projectId: project.id,
      userId: user.id,
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

// ── Email template ─────────────────────────────────────────────────────────

function magicLinkEmailTemplate(projectName: string, magicUrl: string): string {
  return `
    <h2>Your portal access — ${projectName}</h2>
    <p>Click the button below to access the client portal. No password needed.</p>
    <a href="${magicUrl}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;border-radius:6px;text-decoration:none;">
      Open portal
    </a>
    <p style="margin-top:16px;color:#666;font-size:14px;">
      This link gives you access for 90 days. Bookmark it for quick access.
    </p>
  `;
}
