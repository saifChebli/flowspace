'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePortalStore } from '@/stores/portalStore';
import portalApi from '@/lib/portalApi';
import { Hash, ArrowLeft, Send } from 'lucide-react';
import type { Message } from '@/types';

interface FeedResponse {
  messages: Message[];
  nextCursor?: string;
}

export default function PortalChannelPage() {
  const { projectId, channelId } = useParams<{ projectId: string; channelId: string }>();
  const { session, isAuthenticated } = usePortalStore();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!isAuthenticated) router.replace('/');
  }, [isAuthenticated, router]);

  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['portal', 'messages', channelId],
    queryFn: ({ pageParam }) =>
      portalApi
        .get(`/channels/${channelId}/messages`, { params: { cursor: pageParam, limit: 50 } })
        .then((r) => r.data as FeedResponse),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor,
    enabled: isAuthenticated,
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      portalApi.post(`/channels/${channelId}/messages`, { body: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'messages', channelId] });
      setBody('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    },
  });

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    sendMutation.mutate(text);
  }

  const allMessages = data?.pages.flatMap((p) => p.messages) ?? [];

  if (!isAuthenticated) return null;

  return (
    <div className="hero-grid flex min-h-screen flex-col px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        {/* Header */}
        <header className="mb-4 flex items-center gap-3">
          <Link
            href={`/portal/dashboard/${projectId}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition hover:bg-muted/50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
            <Hash className="h-3.5 w-3.5 text-accent" />
          </div>
          <div>
            <div className="eyebrow">Client Portal</div>
            <h1 className="text-lg font-semibold tracking-tight">Channel</h1>
          </div>
          <span className="ml-auto text-xs text-muted-foreground">{session?.email}</span>
        </header>

        {/* Messages */}
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm">
          <div className="flex flex-1 flex-col overflow-y-auto px-4 py-3">
            {hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="mx-auto mb-3 rounded-lg border border-border/60 bg-white px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load older messages'}
              </button>
            )}

            {allMessages.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No messages in this channel yet. Start the conversation!
              </p>
            )}

            <div className="flex flex-col gap-1">
              {allMessages.map((msg) => (
                <PortalMessage key={msg.id} message={msg} currentUserId={session?.userId} />
              ))}
            </div>
            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          <form onSubmit={handleSend} className="border-t border-border/60 p-3">
            <div className="flex items-center gap-2">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                placeholder="Type a message…"
              />
              <button
                type="submit"
                disabled={!body.trim() || sendMutation.isPending}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-white shadow transition hover:bg-gold/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function PortalMessage({
  message,
  currentUserId,
}: {
  message: Message;
  currentUserId?: string;
}) {
  const isOwn = message.author.id === currentUserId;
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(message.createdAt));

  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/30 ${
        isOwn ? 'bg-accent-soft/15' : ''
      }`}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-semibold text-accent">
        {message.author.name?.charAt(0).toUpperCase() ?? '?'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">{message.author.name}</span>
          {isOwn && (
            <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[9px] font-semibold text-accent">
              You
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">{time}</span>
        </div>
        <p className="mt-0.5 text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
          {message.body}
        </p>
      </div>
    </div>
  );
}
