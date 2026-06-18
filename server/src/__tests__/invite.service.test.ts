// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockInviteToken = { findUnique: jest.fn(), update: jest.fn() };
const mockUser = { findUnique: jest.fn() };
const mockWorkspaceMember = { findUnique: jest.fn(), create: jest.fn() };
const mockProjectMember = { findUnique: jest.fn(), create: jest.fn() };
const mockProject = { findUnique: jest.fn() };
const mockWorkspace = { findUnique: jest.fn() };
const mockNotification = { create: jest.fn() };
const mockActivityLog = { create: jest.fn() };
const mockTransaction = jest.fn();

jest.mock('../lib/prisma', () => ({
  prisma: {
    inviteToken: mockInviteToken,
    user: mockUser,
    workspaceMember: mockWorkspaceMember,
    projectMember: mockProjectMember,
    project: mockProject,
    workspace: mockWorkspace,
    notification: mockNotification,
    activityLog: mockActivityLog,
    $transaction: mockTransaction,
  },
}));

jest.mock('../server', () => ({ io: { to: () => ({ emit: jest.fn() }) } }));

jest.mock('../lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  inviteEmailTemplate: jest.fn().mockReturnValue('<html>'),
}));

jest.mock('../config/env', () => ({
  env: { CLIENT_URL: 'http://localhost:3000' },
}));

import { acceptInvite } from '../modules/workspaces/service';
import { acceptProjectInvite } from '../modules/projects/service';

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const FUTURE = new Date(Date.now() + 86400000);

const workspaceInvite = {
  id: 'inv1',
  token: 'token-ws',
  email: 'alice@example.com',
  workspaceId: 'ws1',
  projectId: null,
  role: 'MEMBER',
  expiresAt: FUTURE,
  acceptedAt: null,
};

const projectInvite = {
  id: 'inv2',
  token: 'token-proj',
  email: 'alice@example.com',
  workspaceId: null,
  projectId: 'proj1',
  role: 'MEMBER',
  expiresAt: FUTURE,
  acceptedAt: null,
};

// ─── Workspace invite acceptance ─────────────────────────────────────────────

describe('acceptInvite() — workspace', () => {
  it('succeeds when authenticated user email matches invite email', async () => {
    mockInviteToken.findUnique.mockResolvedValue(workspaceInvite);
    mockUser.findUnique.mockResolvedValue({ email: 'alice@example.com' });
    mockWorkspaceMember.findUnique.mockResolvedValue(null);
    mockTransaction.mockResolvedValue([{}, {}]);

    const result = await acceptInvite('token-ws', 'user-alice');
    expect(result).toMatchObject({ workspaceId: 'ws1' });
  });

  it('rejects when authenticated user email does NOT match invite email', async () => {
    mockInviteToken.findUnique.mockResolvedValue(workspaceInvite);
    mockUser.findUnique.mockResolvedValue({ email: 'eve@attacker.com' }); // wrong user

    await expect(acceptInvite('token-ws', 'user-eve')).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringContaining('not sent to your email'),
    });
  });

  it('rejects an expired invite', async () => {
    mockInviteToken.findUnique.mockResolvedValue({
      ...workspaceInvite,
      expiresAt: new Date(Date.now() - 1000),
    });
    mockUser.findUnique.mockResolvedValue({ email: 'alice@example.com' });

    await expect(acceptInvite('token-ws', 'user-alice')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects an already-accepted invite', async () => {
    mockInviteToken.findUnique.mockResolvedValue({
      ...workspaceInvite,
      acceptedAt: new Date(),
    });
    mockUser.findUnique.mockResolvedValue({ email: 'alice@example.com' });

    await expect(acceptInvite('token-ws', 'user-alice')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('rejects a non-existent invite', async () => {
    mockInviteToken.findUnique.mockResolvedValue(null);
    mockUser.findUnique.mockResolvedValue({ email: 'alice@example.com' });

    await expect(acceptInvite('bad-token', 'user-alice')).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

// ─── Project invite acceptance ────────────────────────────────────────────────

describe('acceptProjectInvite() — project', () => {
  it('succeeds when authenticated user email matches invite email', async () => {
    mockInviteToken.findUnique.mockResolvedValue(projectInvite);
    mockUser.findUnique.mockResolvedValue({ email: 'alice@example.com' });
    mockProjectMember.findUnique.mockResolvedValue(null);
    mockTransaction.mockResolvedValue([{}, {}]);

    const result = await acceptProjectInvite('token-proj', 'user-alice');
    expect(result).toMatchObject({ projectId: 'proj1' });
  });

  it('rejects when authenticated user email does NOT match invite email', async () => {
    mockInviteToken.findUnique.mockResolvedValue(projectInvite);
    mockUser.findUnique.mockResolvedValue({ email: 'mallory@hacker.com' });

    await expect(acceptProjectInvite('token-proj', 'user-mallory')).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringContaining('not sent to your email'),
    });
  });

  it('rejects a project invite used for a workspace slot', async () => {
    mockInviteToken.findUnique.mockResolvedValue({
      ...projectInvite,
      projectId: null,
      workspaceId: 'ws1',
    });
    mockUser.findUnique.mockResolvedValue({ email: 'alice@example.com' });

    await expect(acceptProjectInvite('token-proj', 'user-alice')).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
