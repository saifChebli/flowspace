import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { verifyAccessToken } from '../lib/jwt';

declare global {
  namespace Express {
    interface Request {
      portalUser?: {
        id: string;
        email: string;
        projectId: string;
        userId: string;
      };
    }
  }
}

/**
 * Authenticate via portal session token sent in `X-Portal-Token` header.
 * Attaches `req.portalUser` on success.
 */
export async function authenticatePortal(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.headers['x-portal-token'] as string | undefined;

  if (!token) {
    res.status(401).json({ error: 'Missing X-Portal-Token header' });
    return;
  }

  try {
    const session = await prisma.portalSession.findUnique({ where: { token } });

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ error: 'Invalid or expired portal session' });
      return;
    }

    // Refresh session: extend expiry by 90 days on each active use
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 90);

    await prisma.portalSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date(), expiresAt: newExpiry },
    });

    req.portalUser = {
      id: session.id,
      email: session.email,
      projectId: session.projectId,
      userId: session.userId,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Portal authentication failed' });
  }
}

/**
 * Combined middleware: tries standard JWT auth first, falls back to portal token.
 * Sets either `req.user` (team) or `req.portalUser` (client portal).
 */
export async function authenticateAny(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  // Try JWT first
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccessToken(authHeader.slice(7));
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true, emailVerified: true },
      });
      if (user && user.emailVerified) {
        req.user = { id: user.id, email: user.email, name: user.name };
        return next();
      }
    } catch {
      // JWT failed — fall through to portal token
    }
  }

  // Try portal token
  const portalToken = req.headers['x-portal-token'] as string | undefined;
  if (portalToken) {
    return authenticatePortal(req, res, next);
  }

  res.status(401).json({ error: 'Authentication required' });
}
