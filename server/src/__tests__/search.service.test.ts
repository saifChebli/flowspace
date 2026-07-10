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

beforeEach(() => jest.clearAllMocks());

describe('searchProject — channel visibility', () => {
  it('restricts CLIENT searches to CLIENT_VISIBLE channels', async () => {
    mockProjectMember.findUnique.mockResolvedValue({ role: 'CLIENT' });
    await searchProject('p1', 'u1', 'hello');
    const where = mockMessage.findMany.mock.calls[0][0].where;
    expect(where.channel).toEqual({ projectId: 'p1', type: 'CLIENT_VISIBLE' });
  });

  it('lets MEMBERs search all non-private channels', async () => {
    mockProjectMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
    await searchProject('p1', 'u1', 'hello');
    const where = mockMessage.findMany.mock.calls[0][0].where;
    expect(where.channel.OR).toBeDefined();
    expect(where.channel.type).toBeUndefined(); // not pinned to a single type
  });

  it('skips the DB for queries shorter than 2 chars', async () => {
    const res = await searchProject('p1', 'u1', 'a');
    expect(mockMessage.findMany).not.toHaveBeenCalled();
    expect(res).toEqual({ messages: [], tasks: [], files: [] });
  });
});
