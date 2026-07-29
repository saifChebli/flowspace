/**
 * Regression tests for the cross-tenant isolation rules. These are the bugs that
 * must never silently start returning data again.
 */
const mockChannel = { findUnique: jest.fn() };
const mockProjectMember = { findUnique: jest.fn() };
const mockChannelMember = { findUnique: jest.fn() };
const mockMessage = { findUnique: jest.fn(), findMany: jest.fn().mockResolvedValue([]) };
const mockTask = { findUnique: jest.fn(), update: jest.fn() };
const mockBoardList = { findUnique: jest.fn() };
const mockFile = { count: jest.fn() };

jest.mock('../lib/prisma', () => ({
  prisma: {
    channel: mockChannel,
    projectMember: mockProjectMember,
    channelMember: mockChannelMember,
    message: mockMessage,
    task: mockTask,
    boardList: mockBoardList,
    file: mockFile,
  },
}));
jest.mock('../server', () => ({ io: { to: () => ({ emit: jest.fn() }) } }));
jest.mock('../events/activity', () => ({ logActivity: jest.fn() }));

import { assertChannelAccess, resolveProjectAccess } from '../lib/actor';
import { listThreadReplies, sendMessage } from '../modules/messages/service';
import { moveTask } from '../modules/tasks/service';

const team = { userId: 'u1', portalProjectId: null };
const portalOnP1 = { userId: 'u1', portalProjectId: 'p1' };

beforeEach(() => {
  jest.clearAllMocks();
  mockChannelMember.findUnique.mockResolvedValue(null);
});

describe('resolveProjectAccess — portal confinement (C1)', () => {
  it('blocks a portal session reaching another project', async () => {
    mockProjectMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
    await expect(resolveProjectAccess('p2', portalOnP1)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('downgrades the effective role to CLIENT for portal sessions', async () => {
    mockProjectMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
    const access = await resolveProjectAccess('p1', portalOnP1);
    expect(access.role).toBe('CLIENT');
    expect(access.isPortal).toBe(true);
  });

  it('keeps the real role for normal team auth', async () => {
    mockProjectMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
    expect((await resolveProjectAccess('p1', team)).role).toBe('MEMBER');
  });

  it('rejects a non-member', async () => {
    mockProjectMember.findUnique.mockResolvedValue(null);
    await expect(resolveProjectAccess('p1', team)).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('assertChannelAccess', () => {
  it('denies a client a non-client-visible channel', async () => {
    mockChannel.findUnique.mockResolvedValue({ id: 'c1', projectId: 'p1', type: 'PUBLIC', name: 'general' });
    mockProjectMember.findUnique.mockResolvedValue({ role: 'CLIENT' });
    await expect(assertChannelAccess('c1', team)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('denies a team member a PRIVATE channel they are not in', async () => {
    mockChannel.findUnique.mockResolvedValue({ id: 'c1', projectId: 'p1', type: 'PRIVATE', name: 'secret' });
    mockProjectMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
    mockChannelMember.findUnique.mockResolvedValue(null);
    await expect(assertChannelAccess('c1', team)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('allows a PRIVATE channel member', async () => {
    mockChannel.findUnique.mockResolvedValue({ id: 'c1', projectId: 'p1', type: 'PRIVATE', name: 'secret' });
    mockProjectMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
    mockChannelMember.findUnique.mockResolvedValue({ id: 'cm1' });
    await expect(assertChannelAccess('c1', team)).resolves.toBeTruthy();
  });
});

describe('listThreadReplies (C5)', () => {
  it('denies a client reading a thread in an internal channel', async () => {
    mockMessage.findUnique.mockResolvedValue({
      id: 'm1',
      channelId: 'c1',
      channel: { id: 'c1', projectId: 'p1', type: 'PUBLIC' },
    });
    mockChannel.findUnique.mockResolvedValue({ id: 'c1', projectId: 'p1', type: 'PUBLIC', name: 'general' });
    mockProjectMember.findUnique.mockResolvedValue({ role: 'CLIENT' });

    await expect(listThreadReplies('m1', team)).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('moveTask (C4)', () => {
  it('refuses a destination list in another project', async () => {
    mockTask.findUnique.mockResolvedValue({
      id: 't1',
      completedAt: null,
      title: 'x',
      list: { board: { projectId: 'p1' } },
    });
    mockProjectMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
    mockBoardList.findUnique.mockResolvedValue({ id: 'l9', name: 'To Do', board: { projectId: 'OTHER' } });

    await expect(moveTask('t1', 'u1', { listId: 'l9', position: 0 })).rejects.toMatchObject({ statusCode: 403 });
    expect(mockTask.update).not.toHaveBeenCalled();
  });

  it('allows a destination list in the same project', async () => {
    mockTask.findUnique.mockResolvedValue({
      id: 't1',
      completedAt: null,
      title: 'x',
      list: { board: { projectId: 'p1' } },
    });
    mockProjectMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
    mockBoardList.findUnique.mockResolvedValue({ id: 'l2', name: 'To Do', board: { projectId: 'p1' } });
    mockTask.update.mockResolvedValue({ id: 't1' });

    await expect(moveTask('t1', 'u1', { listId: 'l2', position: 0 })).resolves.toBeTruthy();
  });
});

describe('sendMessage input validation (C6)', () => {
  const channel = { id: 'c1', projectId: 'p1', type: 'CLIENT_VISIBLE', name: 'client-updates' };

  beforeEach(() => {
    mockChannel.findUnique.mockResolvedValue(channel);
    mockProjectMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
  });

  it('rejects attachments that belong to another project', async () => {
    mockFile.count.mockResolvedValue(0); // none of the ids are in this project
    await expect(
      sendMessage('c1', team, { body: 'hi', fileIds: ['f-other'] } as never),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects a parentId from a different channel', async () => {
    mockMessage.findUnique.mockResolvedValue({ channelId: 'c-other', deletedAt: null });
    await expect(
      sendMessage('c1', team, { body: 'hi', parentId: 'm-other' } as never),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects a reply to a deleted message', async () => {
    mockMessage.findUnique.mockResolvedValue({ channelId: 'c1', deletedAt: new Date() });
    await expect(
      sendMessage('c1', team, { body: 'hi', parentId: 'm1' } as never),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
