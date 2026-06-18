import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors';
import { env } from './config/env';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

// Module routers
import authRouter from './modules/auth/router';
import workspacesRouter from './modules/workspaces/router';
import projectsRouter from './modules/projects/router';
import channelsRouter from './modules/channels/router';
import messagesRouter from './modules/messages/router';
import boardsRouter from './modules/boards/router';
import tasksRouter from './modules/tasks/router';
import filesRouter from './modules/files/router';
import notificationsRouter from './modules/notifications/router';
import dashboardRouter from './modules/dashboard/router';
import portalRouter from './modules/portal/router';

export function createApp() {
  const app = express();

  // Behind Railway/Vercel TLS proxies — required for Secure cookies and
  // correct client IPs in express-rate-limit.
  app.set('trust proxy', 1);

  // ─── Security & parsing ──────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", env.CLIENT_URL],
          imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
        },
      },
      // API is consumed cross-origin by the Next.js client.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(globalRateLimiter);

  // ─── Health check ─────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ─── API routes ───────────────────────────────────────────────────────────
  app.use('/api/auth', authRouter);
  app.use('/api/workspaces', workspacesRouter);
  app.use('/api/workspaces/:workspaceSlug/projects', projectsRouter);
  app.use('/api/projects/:projectId/channels', channelsRouter);
  app.use('/api/channels/:channelId/messages', messagesRouter);
  app.use('/api/projects/:projectId/boards', boardsRouter);
  app.use('/api/lists/:listId/tasks', tasksRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/projects/:projectId/files', filesRouter);
  app.use('/api/projects/:projectId/dashboard', dashboardRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/portal', portalRouter);

  // ─── 404 handler ──────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // ─── Global error handler ─────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
