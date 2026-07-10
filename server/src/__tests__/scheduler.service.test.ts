const mockTask = { findMany: jest.fn() };
const mockNotification = { groupBy: jest.fn().mockResolvedValue([]) };
const mockUser = { findUnique: jest.fn() };
const mockSendEmail = jest.fn().mockResolvedValue(undefined);

jest.mock('../lib/prisma', () => ({
  prisma: { task: mockTask, notification: mockNotification, user: mockUser },
}));
jest.mock('../lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
  digestEmailTemplate: () => '<html>',
  dueReminderEmailTemplate: () => '<html>',
}));
jest.mock('../config/env', () => ({ env: { CLIENT_URL: 'http://x' } }));

import { sendDueReminders } from '../events/scheduler';

beforeEach(() => jest.clearAllMocks());

describe('sendDueReminders', () => {
  it('queries the 24h window (not done, not deleted) and emails each assignee', async () => {
    mockTask.findMany.mockResolvedValue([
      {
        title: 'Ship it',
        dueDate: new Date(),
        assignees: [{ user: { email: 'a@x.com', name: 'A' } }, { user: { email: 'b@x.com', name: 'B' } }],
        list: { board: { project: { name: 'Proj' } } },
      },
    ]);

    await sendDueReminders();

    const where = mockTask.findMany.mock.calls[0][0].where;
    expect(where.completedAt).toBeNull();
    expect(where.deletedAt).toBeNull();
    expect(where.dueDate.gte).toBeInstanceOf(Date);
    expect(where.dueDate.lte).toBeInstanceOf(Date);
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@x.com' }));
  });
});
