import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { sendEmail, verifyEmailTemplate, passwordResetTemplate } from '../../lib/email';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/env';
import type {
  RegisterInput,
  LoginInput,
  RefreshInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './schema';

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(input.password, 12);
  const emailVerifyToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      emailVerifyToken,
    },
    select: { id: true, email: true, name: true },
  });

  const verifyUrl = `${env.CLIENT_URL}/auth/verify-email?token=${emailVerifyToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your CollabSpace email',
    html: verifyEmailTemplate(user.name, verifyUrl),
  });

  return { message: 'Registration successful. Check your email to verify.' };
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
  if (!user) throw new AppError(400, 'Invalid or expired verification token');

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerifyToken: null },
  });

  return { message: 'Email verified successfully' };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new AppError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials');

  if (!user.emailVerified) throw new AppError(403, 'Email not verified');

  return issueTokens(user.id, user.email);
}

export async function refresh(input: RefreshInput) {
  let payload;
  try {
    payload = verifyRefreshToken(input.refreshToken);
  } catch {
    throw new AppError(401, 'Invalid or expired refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: input.refreshToken },
    include: { user: true },
  });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Refresh token revoked or expired');
  }

  // Rotate: delete old, issue new
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  return issueTokens(stored.user.id, stored.user.email);
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  return { message: 'Logged out' };
}

export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // Always return success to avoid email enumeration
  if (!user) return { message: 'If that email exists, a reset link has been sent.' };

  const resetToken = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  const resetUrl = `${env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Reset your CollabSpace password',
    html: passwordResetTemplate(user.name, resetUrl),
  });

  return { message: 'If that email exists, a reset link has been sent.' };
}

export async function resetPassword(input: ResetPasswordInput) {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: input.token,
      resetTokenExpiry: { gt: new Date() },
    },
  });
  if (!user) throw new AppError(400, 'Invalid or expired reset token');

  const passwordHash = await bcrypt.hash(input.password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  // Invalidate all refresh tokens on password reset
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

  return { message: 'Password reset successfully' };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
  });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function issueTokens(userId: string, email: string) {
  const jti = uuidv4();
  const accessToken = signAccessToken({ sub: userId, email });
  const rawRefreshToken = signRefreshToken({ sub: userId, jti });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { token: rawRefreshToken, userId, expiresAt },
  });

  return { accessToken, refreshToken: rawRefreshToken };
}
