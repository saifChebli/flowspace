import { Request, Response, NextFunction } from 'express';
import * as authService from './service';
import { env } from '../../config/env';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './schema';

const REFRESH_COOKIE = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/auth';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// In production the frontend (Vercel) and backend (Railway) are different sites,
// so the refresh cookie must be SameSite=None + Secure to be sent cross-site.
const isProd = env.NODE_ENV === 'production';
const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  path: REFRESH_COOKIE_PATH,
};

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, { ...refreshCookieOptions, maxAge: SEVEN_DAYS_MS });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.query as { token: string };
    if (!token) { res.status(400).json({ error: 'Token required' }); return; }
    const result = await authService.verifyEmail(token);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const { accessToken, refreshToken } = await authService.login(input);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) { res.status(401).json({ error: 'Missing refresh token' }); return; }
    const { accessToken, refreshToken: rotated } = await authService.refresh({ refreshToken });
    setRefreshCookie(res, rotated);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (refreshToken) await authService.logout(refreshToken);
    clearRefreshCookie(res);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const input = forgotPasswordSchema.parse(req.body);
    const result = await authService.forgotPassword(input);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const input = resetPasswordSchema.parse(req.body);
    const result = await authService.resetPassword(input);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}
