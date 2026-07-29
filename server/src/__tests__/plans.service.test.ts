const mockWorkspace = { findUnique: jest.fn() };
const mockProject = { count: jest.fn() };
const mockFile = { aggregate: jest.fn() };

jest.mock('../lib/prisma', () => ({
  prisma: { workspace: mockWorkspace, project: mockProject, file: mockFile },
}));

import { assertCanCreateProject, assertCanUpload, effectivePlan, PLAN_LIMITS } from '../modules/plans/service';

const GB = 1024 * 1024 * 1024;

beforeEach(() => {
  jest.clearAllMocks();
  mockProject.count.mockResolvedValue(0);
  mockFile.aggregate.mockResolvedValue({ _sum: { sizeBytes: 0 } });
});

describe('effectivePlan', () => {
  it('keeps a paid plan with no expiry', () => {
    expect(effectivePlan({ plan: 'PRO', planExpiresAt: null })).toBe('PRO');
  });

  it('keeps a paid plan that has not expired', () => {
    expect(effectivePlan({ plan: 'AGENCY', planExpiresAt: new Date(Date.now() + 86400000) })).toBe('AGENCY');
  });

  it('falls back to FREE once a paid plan has expired', () => {
    expect(effectivePlan({ plan: 'PRO', planExpiresAt: new Date(Date.now() - 1000) })).toBe('FREE');
  });
});

describe('assertCanCreateProject', () => {
  it('blocks the 4th active project on FREE', async () => {
    mockWorkspace.findUnique.mockResolvedValue({ plan: 'FREE', planExpiresAt: null });
    mockProject.count.mockResolvedValue(PLAN_LIMITS.FREE.projects as number);

    await expect(assertCanCreateProject('w1')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('allows the 3rd project on FREE', async () => {
    mockWorkspace.findUnique.mockResolvedValue({ plan: 'FREE', planExpiresAt: null });
    mockProject.count.mockResolvedValue(2);

    await expect(assertCanCreateProject('w1')).resolves.toBeUndefined();
  });

  it('allows unlimited projects on PRO', async () => {
    mockWorkspace.findUnique.mockResolvedValue({ plan: 'PRO', planExpiresAt: null });
    mockProject.count.mockResolvedValue(500);

    await expect(assertCanCreateProject('w1')).resolves.toBeUndefined();
  });
});

describe('assertCanUpload', () => {
  it('blocks an upload that would exceed the FREE storage cap', async () => {
    mockWorkspace.findUnique.mockResolvedValue({ plan: 'FREE', planExpiresAt: null });
    mockFile.aggregate.mockResolvedValue({ _sum: { sizeBytes: 1 * GB - 100 } });

    await expect(assertCanUpload('w1', 200)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('allows an upload that fits exactly', async () => {
    mockWorkspace.findUnique.mockResolvedValue({ plan: 'FREE', planExpiresAt: null });
    mockFile.aggregate.mockResolvedValue({ _sum: { sizeBytes: 1 * GB - 200 } });

    await expect(assertCanUpload('w1', 200)).resolves.toBeUndefined();
  });

  it('uses FREE caps for an expired PRO plan', async () => {
    mockWorkspace.findUnique.mockResolvedValue({ plan: 'PRO', planExpiresAt: new Date(Date.now() - 1000) });
    mockFile.aggregate.mockResolvedValue({ _sum: { sizeBytes: 2 * GB } }); // fine on PRO, over on FREE

    await expect(assertCanUpload('w1', 1)).rejects.toMatchObject({ statusCode: 403 });
  });
});
