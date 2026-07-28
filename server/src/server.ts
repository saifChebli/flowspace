import 'dotenv/config';
import { initSentry } from './lib/sentry';

// Must run before the app and its instrumented libraries are loaded.
initSentry();

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { env } from './config/env';
import { verifyAccessToken } from './lib/jwt';
import { prisma } from './lib/prisma';
import { corsOptions } from './config/cors';
import { startScheduler } from './events/scheduler';

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

// Room-join authorization: verify DB membership before letting a socket into a
// room. Without this, any authenticated user could join any channel/project room
// and receive its real-time events (including PRIVATE channels).
async function canAccessChannel(userId: string, channelId: string): Promise<boolean> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { projectId: true, type: true },
  });
  if (!channel) return false;
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: channel.projectId, userId } },
  });
  if (!member) return false;
  if (member.role === 'CLIENT' && channel.type !== 'CLIENT_VISIBLE') return false;
  if (channel.type === 'PRIVATE') {
    const cm = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!cm) return false;
  }
  return true;
}

async function isProjectMember(userId: string, projectId: string): Promise<boolean> {
  const m = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return !!m;
}

io.on('connection', (socket) => {
  const user = socket.data.user as { id: string; name: string };

  console.log(`[Socket] Connected: ${user.name} (${socket.id})`);

  // Auto-join a personal room for notifications
  socket.join(`user:${user.id}`);

  // Join a channel room for real-time messages — only if the user may access it.
  socket.on('channel:join', async (channelId: string) => {
    if (await canAccessChannel(user.id, channelId)) {
      socket.join(`channel:${channelId}`);
    }
  });

  socket.on('channel:leave', (channelId: string) => {
    socket.leave(`channel:${channelId}`);
  });

  // Join a project room for board/task updates — only if the user is a member.
  socket.on('project:join', async (projectId: string) => {
    if (await isProjectMember(user.id, projectId)) {
      socket.join(`project:${projectId}`);
    }
  });

  socket.on('project:leave', (projectId: string) => {
    socket.leave(`project:${projectId}`);
  });

  // NOTE: message:new / task:moved / task:updated are now emitted authoritatively
  // by the REST service layer after DB commit (see modules/messages & modules/tasks),
  // not relayed from clients — so they can't be spoofed or injected.

  // Typing indicators (ephemeral; only reach sockets already in the room)
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
  startScheduler();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  httpServer.close(() => process.exit(0));
});
