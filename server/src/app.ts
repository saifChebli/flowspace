import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsOptions } from './config/cors';
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

export function createApp() {
  const app = express();

  // ─── Security & parsing ──────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors(corsOptions));
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
  app.use('/api/notifications', notificationsRouter);

  // ─── 404 handler ──────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // ─── Global error handler ─────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
