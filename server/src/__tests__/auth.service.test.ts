import crypto from 'crypto';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockUser = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};
const mockRefreshToken = {
  findUnique: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
};

jest.mock('../lib/prisma', () => ({
  prisma: { user: mockUser, refreshToken: mockRefreshToken },
}));

jest.mock('../lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  verifyEmailTemplate: jest.fn().mockReturnValue('<html>verify</html>'),
  passwordResetTemplate: jest.fn().mockReturnValue('<html>reset</html>'),
}));

jest.mock('../lib/jwt', () => ({
  signAccessToken: jest.fn().mockReturnValue('mock-access'),
  signRefreshToken: jest.fn().mockReturnValue('mock-refresh'),
  verifyRefreshToken: jest.fn(),
}));

jest.mock('../config/env', () => ({
  env: { CLIENT_URL: 'http://localhost:3000', JWT_REFRESH_EXPIRES_IN: '7d' },
}));

// ─── Subject (imported after mocks are established) ───────────────────────────

import * as authService from '../modules/auth/service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sha256(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// ─── register ────────────────────────────────────────────────────────────────

describe('register()', () => {
  it('stores a SHA-256 hash of the verify token, not the raw token', async () => {
    mockUser.findUnique.mockResolvedValue(null);
    mockUser.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: 'u1', email: data.email as string, name: data.name as string })
    );

    await authService.register({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'Password1',
    });

    const createCall = mockUser.create.mock.calls[0][0];
    const storedToken: string = createCall.data.emailVerifyToken as string;

    // The stored value must be a 64-char hex SHA-256 digest
    expect(storedToken).toMatch(/^[a-f0-9]{64}$/);

    // The stored value must NOT equal the raw token that would come from randomBytes
    // We verify indirectly: the URL in the sent email contains the RAW token,
    // which when hashed should equal the stored token.
    const { sendEmail } = await import('../lib/email');
    const emailArg = (sendEmail as jest.Mock).mock.calls[0][0] as { html: string };
    const sentUrl = (emailArg as unknown as { to: string; subject: string; html: string }).html;

    // Extract the raw token from the verifyUrl passed into the template
    const { verifyEmailTemplate } = await import('../lib/email');
    const templateCall = (verifyEmailTemplate as jest.Mock).mock.calls[0];
    const rawTokenInUrl: string = (templateCall[1] as string).split('token=')[1];

    expect(sha256(rawTokenInUrl)).toBe(storedToken);
    void sentUrl; // suppress unused warning
  });

  it('stores an expiry for the verify token', async () => {
    mockUser.findUnique.mockResolvedValue(null);
    mockUser.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: 'u1', email: data.email as string, name: data.name as string })
    );

    const before = Date.now();
    await authService.register({ name: 'Bob', email: 'bob@example.com', password: 'Password1' });
    const after = Date.now();

    const expiry: Date = mockUser.create.mock.calls[0][0].data.emailVerifyTokenExpiry as Date;
    expect(expiry.getTime()).toBeGreaterThan(before);
    // should be roughly 24 h from now
    expect(expiry.getTime()).toBeLessThanOrEqual(after + 24 * 60 * 60 * 1000 + 1000);
  });

  it('throws 409 when email is already registered', async () => {
    mockUser.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(
      authService.register({ name: 'Eve', email: 'eve@example.com', password: 'Password1' })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

// ─── verifyEmail ─────────────────────────────────────────────────────────────

describe('verifyEmail()', () => {
  it('looks up the SHA-256 hash of the incoming token', async () => {
    const rawToken = 'abc123';
    const hashed = sha256(rawToken);

    mockUser.findFirst.mockResolvedValue({ id: 'u1' });
    mockUser.update.mockResolvedValue({});

    await authService.verifyEmail(rawToken);

    expect(mockUser.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ emailVerifyToken: hashed }),
      })
    );
  });

  it('rejects when no user matches (wrong or expired token)', async () => {
    mockUser.findFirst.mockResolvedValue(null);
    await expect(authService.verifyEmail('bad-token')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('clears both token and expiry on success', async () => {
    mockUser.findFirst.mockResolvedValue({ id: 'u1' });
    mockUser.update.mockResolvedValue({});

    await authService.verifyEmail('valid-raw-token');

    expect(mockUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          emailVerified: true,
          emailVerifyToken: null,
          emailVerifyTokenExpiry: null,
        }),
      })
    );
  });
});

// ─── forgotPassword ──────────────────────────────────────────────────────────

describe('forgotPassword()', () => {
  it('stores a SHA-256 hash of the reset token', async () => {
    mockUser.findUnique.mockResolvedValue({ id: 'u1', email: 'u@e.com', name: 'User' });
    mockUser.update.mockResolvedValue({});

    await authService.forgotPassword({ email: 'u@e.com' });

    const updateData = mockUser.update.mock.calls[0][0].data as Record<string, unknown>;
    const storedResetToken = updateData.resetToken as string;
    expect(storedResetToken).toMatch(/^[a-f0-9]{64}$/);
  });

  it('does not reveal whether the email exists (safe enumeration guard)', async () => {
    mockUser.findUnique.mockResolvedValue(null);
    const result = await authService.forgotPassword({ email: 'nobody@example.com' });
    expect(result.message).toContain('If that email exists');
  });
});

// ─── resetPassword ───────────────────────────────────────────────────────────

describe('resetPassword()', () => {
  it('looks up the SHA-256 hash of the incoming token', async () => {
    const rawToken = 'reset-raw';
    const hashed = sha256(rawToken);

    mockUser.findFirst.mockResolvedValue({ id: 'u1' });
    mockUser.update.mockResolvedValue({});
    mockRefreshToken.deleteMany.mockResolvedValue({});

    await authService.resetPassword({ token: rawToken, password: 'NewPass1' });

    expect(mockUser.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ resetToken: hashed }),
      })
    );
  });

  it('invalidates all refresh tokens on password change', async () => {
    mockUser.findFirst.mockResolvedValue({ id: 'u1' });
    mockUser.update.mockResolvedValue({});
    mockRefreshToken.deleteMany.mockResolvedValue({});

    await authService.resetPassword({ token: 'any', password: 'NewPass1' });

    expect(mockRefreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
  });
});

// ─── refresh ─────────────────────────────────────────────────────────────────

describe('refresh()', () => {
  it('rotates the refresh token (old deleted, new issued)', async () => {
    const { verifyRefreshToken } = await import('../lib/jwt');
    (verifyRefreshToken as jest.Mock).mockReturnValue({ sub: 'u1', jti: 'jti1' });

    mockRefreshToken.findUnique.mockResolvedValue({
      id: 'rt1',
      expiresAt: new Date(Date.now() + 86400000),
      user: { id: 'u1', email: 'u@e.com', emailVerified: true, suspendedAt: null },
    });
    mockRefreshToken.delete.mockResolvedValue({});
    mockRefreshToken.create.mockResolvedValue({});

    await authService.refresh({ refreshToken: 'old-token' });

    expect(mockRefreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt1' } });
    expect(mockRefreshToken.create).toHaveBeenCalled();
  });

  it('refuses to refresh a suspended account', async () => {
    const { verifyRefreshToken } = await import('../lib/jwt');
    (verifyRefreshToken as jest.Mock).mockReturnValue({ sub: 'u1', jti: 'jti1' });

    mockRefreshToken.findUnique.mockResolvedValue({
      id: 'rt1',
      expiresAt: new Date(Date.now() + 86400000),
      user: { id: 'u1', email: 'u@e.com', emailVerified: true, suspendedAt: new Date() },
    });

    await expect(authService.refresh({ refreshToken: 'old-token' })).rejects.toMatchObject({ statusCode: 403 });
    expect(mockRefreshToken.create).not.toHaveBeenCalled();
  });

  it('returns 401 (not 500) when a concurrent refresh already consumed the token', async () => {
    const { verifyRefreshToken } = await import('../lib/jwt');
    (verifyRefreshToken as jest.Mock).mockReturnValue({ sub: 'u1', jti: 'jti1' });

    mockRefreshToken.findUnique.mockResolvedValue({
      id: 'rt1',
      expiresAt: new Date(Date.now() + 86400000),
      user: { id: 'u1', email: 'u@e.com', emailVerified: true, suspendedAt: null },
    });
    mockRefreshToken.delete.mockRejectedValue(new Error('P2025: record not found'));

    await expect(authService.refresh({ refreshToken: 'old-token' })).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects when stored token is expired', async () => {
    const { verifyRefreshToken } = await import('../lib/jwt');
    (verifyRefreshToken as jest.Mock).mockReturnValue({ sub: 'u1', jti: 'jti1' });

    mockRefreshToken.findUnique.mockResolvedValue({
      id: 'rt1',
      expiresAt: new Date(Date.now() - 1000), // expired
      user: { id: 'u1', email: 'u@e.com' },
    });

    await expect(authService.refresh({ refreshToken: 'stale-token' })).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
