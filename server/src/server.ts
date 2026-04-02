import 'dotenv/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { env } from './config/env';
import { verifyAccessToken } from './lib/jwt';
import { prisma } from './lib/prisma';
import { corsOptions } from './config/cors';

const app = createApp();
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: corsOptions as object,
  transports: ['websocket', 'polling'],
});

// ─── Socket.io Auth Middleware ────────────────────────────────────────────────

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true },
    });

    if (!user) return next(new Error('User not found'));

    // Attach user to socket data
    socket.data.user = user;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// ─── Socket.io Event Handlers ─────────────────────────────────────────────────

io.on('connection', (socket) => {
  const user = socket.data.user as { id: string; name: string };

  console.log(`[Socket] Connected: ${user.name} (${socket.id})`);

  // Join a channel room for real-time messages
  socket.on('channel:join', (channelId: string) => {
    socket.join(`channel:${channelId}`);
  });

  socket.on('channel:leave', (channelId: string) => {
    socket.leave(`channel:${channelId}`);
  });

  // Join a project room for board/task updates
  socket.on('project:join', (projectId: string) => {
    socket.join(`project:${projectId}`);
  });

  socket.on('project:leave', (projectId: string) => {
    socket.leave(`project:${projectId}`);
  });

  // Real-time message broadcast (called by REST handler after DB insert)
  socket.on('message:new', (data: { channelId: string; message: unknown }) => {
    socket.to(`channel:${data.channelId}`).emit('message:new', data.message);
  });

  // Task board updates — broadcast to project room
  socket.on('task:updated', (data: { projectId: string; task: unknown }) => {
    socket.to(`project:${data.projectId}`).emit('task:updated', data.task);
  });

  socket.on('task:moved', (data: { projectId: string; taskId: string; listId: string; position: number }) => {
    socket.to(`project:${data.projectId}`).emit('task:moved', data);
  });

  // Typing indicators
  socket.on('typing:start', (channelId: string) => {
    socket.to(`channel:${channelId}`).emit('typing:start', { userId: user.id, name: user.name });
  });

  socket.on('typing:stop', (channelId: string) => {
    socket.to(`channel:${channelId}`).emit('typing:stop', { userId: user.id });
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Disconnected: ${user.name} — ${reason}`);
  });
});

// Export io so REST handlers can emit events
export { io };

// ─── Start server ─────────────────────────────────────────────────────────────

const PORT = env.PORT;

httpServer.listen(PORT, () => {
  console.log(`🚀 CollabSpace server running on port ${PORT} [${env.NODE_ENV}]`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  httpServer.close(() => process.exit(0));
});
