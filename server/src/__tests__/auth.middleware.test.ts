import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockVerifyAccessToken = jest.fn();
const mockUserFindUnique = jest.fn();

jest.mock('../lib/jwt', () => ({
  verifyAccessToken: (...args: unknown[]) => mockVerifyAccessToken(...args),
}));

jest.mock('../lib/prisma', () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => mockUserFindUnique(...args) },
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(authHeader?: string): Request {
  return { headers: { authorization: authHeader } } as unknown as Request;
}

function makeRes(): { res: Response; status: jest.Mock; json: jest.Mock } {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const res = { status } as unknown as Response;
  return { res, status, json };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('authenticate middleware', () => {
  it('calls next() with req.user populated for a valid token', async () => {
    mockVerifyAccessToken.mockReturnValue({ sub: 'u1', email: 'u@e.com' });
    mockUserFindUnique.mockResolvedValue({
      id: 'u1',
      email: 'u@e.com',
      name: 'User',
      emailVerified: true,
    });

    const req = makeReq('Bearer valid-token') as Request & { user?: unknown };
    const next = jest.fn() as NextFunction;
    const { res } = makeRes();

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toMatchObject({ id: 'u1', email: 'u@e.com' });
  });

  it('returns 401 when Authorization header is missing', async () => {
    const req = makeReq();
    const { res, status, json } = makeRes();
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringMatching(/missing|invalid/i) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the token signature is invalid', async () => {
    mockVerifyAccessToken.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    const req = makeReq('Bearer tampered-token');
    const { res, status } = makeRes();
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the user no longer exists in the DB', async () => {
    mockVerifyAccessToken.mockReturnValue({ sub: 'deleted', email: 'd@e.com' });
    mockUserFindUnique.mockResolvedValue(null);

    const req = makeReq('Bearer stale-token');
    const { res, status } = makeRes();
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when the user has not verified their email', async () => {
    mockVerifyAccessToken.mockReturnValue({ sub: 'u2', email: 'u2@e.com' });
    mockUserFindUnique.mockResolvedValue({
      id: 'u2',
      email: 'u2@e.com',
      name: 'Unverified',
      emailVerified: false,
    });

    const req = makeReq('Bearer unverified-token');
    const { res, status } = makeRes();
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
