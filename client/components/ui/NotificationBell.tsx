'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';

interface RawNotification {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  actor?: { id: string; name: string; avatarUrl: string | null } | null;
  task?: { id: string; title: string } | null;
  meta?: Record<string, unknown> | null;
}

interface NotificationsResponse {
  notifications: RawNotification[];
  unreadCount: number;
  nextCursor: string | null;
}

function formatNotification(n: RawNotification): { title: string; body: string } {
  const actor = n.actor?.name ?? 'Someone';
  switch (n.type) {
    case 'TASK_ASSIGNED':
      return {
        title: 'Task assigned',
        body: n.task ? `${actor} assigned you to "${n.task.title}"` : `${actor} assigned you to a task`,
      };
    case 'TASK_MENTIONED':
      return {
        title: 'Mentioned in task',
        body: n.task ? `${actor} mentioned you in "${n.task.title}"` : `${actor} mentioned you in a task`,
      };
    case 'MESSAGE_MENTIONED':
      return {
        title: 'Mentioned in chat',
        body: `${actor} mentioned you in a message`,
      };
    case 'FILE_UPLOADED':
      return {
        title: 'New file',
        body: `${actor} uploaded "${(n.meta as Record<string, string>)?.fileName ?? 'a file'}"`,
      };
    case 'INVITE_ACCEPTED':
      return {
        title: 'Invite accepted',
        body: `${actor} joined the workspace`,
      };
    default:
      return { title: 'Notification', body: `You have a new notification` };
  }
}

function relativeTime(dateStr: string) {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { on } = useSocket();

  const { data } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    refetchInterval: 30_000,
  });

  // Real-time notification push — invalidate notifications query
  useEffect(() => {
    const off = on('notification:new', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });
    return off;
  }, [on, queryClient]);

  const markOne = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-white/80 text-muted-foreground transition-all hover:bg-white hover:text-foreground hover:shadow-sm"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="glass-card absolute left-1/2 top-10 z-50 w-80 -translate-x-1/2 overflow-hidden rounded-xl shadow-lg animate-in fade-in-0 slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Notifications</span>
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="flex items-center gap-1 text-xs text-muted-foreground transition hover:text-accent"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const { title, body } = formatNotification(n);
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.read) markOne.mutate(n.id);
                      setOpen(false);
                    }}
                    className={`relative flex w-full flex-col gap-0.5 border-b border-border/30 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent-soft/40 ${
                      n.read ? 'opacity-55' : ''
                    }`}
                  >
                    <span className="text-xs font-semibold">{title}</span>
                    <span className="text-xs text-muted-foreground">{body}</span>
                    <span className="mt-1 text-[10px] text-muted-foreground/60" suppressHydrationWarning>
                      {relativeTime(n.createdAt)}
                    </span>
                    {!n.read && (
                      <span className="absolute right-3.5 top-3.5 h-2 w-2 rounded-full bg-accent" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
