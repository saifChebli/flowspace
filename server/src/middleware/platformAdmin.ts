import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

function adminEmails(): string[] {
  return env.ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean) ?? [];
}

export function isPlatformAdmin(email: string | undefined | null): boolean {
  return !!email && adminEmails().includes(email.toLowerCase());
}

/** Must run after `authenticate` — gates /api/admin/* to the owner allowlist. */
export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isPlatformAdmin(req.user?.email)) {
    return res.status(403).json({ error: 'Platform admin access required' });
  }
  next();
}
