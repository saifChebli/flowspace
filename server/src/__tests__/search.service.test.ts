const mockProjectMember = { findUnique: jest.fn() };
const mockMessage = { findMany: jest.fn().mockResolvedValue([]) };
const mockTask = { findMany: jest.fn().mockResolvedValue([]) };
const mockFile = { findMany: jest.fn().mockResolvedValue([]) };

jest.mock('../lib/prisma', () => ({
  prisma: {
    projectMember: mockProjectMember,
    message: mockMessage,
    task: mockTask,
    file: mockFile,
  },
}));

import { searchProject } from '../modules/search/service';

const team = { userId: 'u1', portalProjectId: null };
const portal = (projectId: string) => ({ userId: 'u1', portalProjectId: projectId });

beforeEach(() => jest.clearAllMocks());

describe('searchProject — channel visibility', () => {
  it('restricts CLIENT searches to CLIENT_VISIBLE channels', async () => {
    mockProjectMember.findUnique.mockResolvedValue({ role: 'CLIENT' });
    await searchProject('p1', team, 'hello');
    const where = mockMessage.findMany.mock.calls[0][0].where;
    expect(where.channel).toEqual({ projectId: 'p1', type: 'CLIENT_VISIBLE' });
  });

  it('lets MEMBERs search all non-private channels', async () => {
    mockProjectMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
    await searchProject('p1', team, 'hello');
    const where = mockMessage.findMany.mock.calls[0][0].where;
    expect(where.channel.OR).toBeDefined();
    expect(where.channel.type).toBeUndefined(); // not pinned to a single type
  });

  it('skips the DB for queries shorter than 2 chars', async () => {
    const res = await searchProject('p1', team, 'a');
    expect(mockMessage.findMany).not.toHaveBeenCalled();
    expect(res).toEqual({ messages: [], tasks: [], files: [] });
  });
});

describe('searchProject — portal confinement', () => {
  it('refuses a portal session searching a different project', async () => {
    mockProjectMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
    await expect(searchProject('p2', portal('p1'), 'hello')).rejects.toMatchObject({ statusCode: 403 });
    expect(mockMessage.findMany).not.toHaveBeenCalled();
  });

  it('forces CLIENT visibility for a portal session even when the user is a MEMBER', async () => {
    // The underlying user is a full team member — the portal credential must not inherit that.
    mockProjectMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
    await searchProject('p1', portal('p1'), 'hello');
    const where = mockMessage.findMany.mock.calls[0][0].where;
    expect(where.channel).toEqual({ projectId: 'p1', type: 'CLIENT_VISIBLE' });
  });
});
