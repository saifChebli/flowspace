'use client';

import { useEffect, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import type { Message } from '@/types';
import MessageBubble from './MessageBubble';

interface FeedResponse {
  messages: Message[];
  nextCursor?: string;
}

export default function MessageFeed({ channelId }: { channelId: string }) {
  const { joinChannel, leaveChannel, on } = useSocket();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['messages', channelId],
    queryFn: ({ pageParam }) =>
      api
        .get(`/channels/${channelId}/messages`, { params: { cursor: pageParam, limit: 50 } })
        .then((r) => r.data as FeedResponse),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor,
  });

  // Join socket room
  useEffect(() => {
    joinChannel(channelId);
    const cleanup = on<Message>('message:new', (msg) => {
      queryClient.setQueryData<{ pages: FeedResponse[] }>(
        ['messages', channelId],
        (old) => {
          if (!old) return old;
          // Dedupe: the sender already added this optimistically, and the server
          // echoes to everyone in the room (including the sender).
          if (old.pages.some((p) => p.messages.some((m) => m.id === msg.id))) return old;
          const pages = [...old.pages];
          pages[pages.length - 1] = {
            ...pages[pages.length - 1],
            messages: [...pages[pages.length - 1].messages, msg],
          };
          return { ...old, pages };
        }
      );
      // Scroll to bottom
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
    return () => {
      leaveChannel(channelId);
      cleanup();
    };
  }, [channelId, joinChannel, leaveChannel, on, queryClient]);

  const allMessages = data?.pages.flatMap((p) => p.messages) ?? [];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mx-auto mt-4 rounded-lg border border-border/60 bg-white px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          {isFetchingNextPage ? 'Loading...' : 'Load older messages'}
        </button>
      )}

      <div className="flex flex-1 flex-col gap-0 px-3 py-3 md:px-4">
        {allMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} channelId={channelId} />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
