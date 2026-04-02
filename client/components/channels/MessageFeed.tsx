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
    <div className="flex flex-1 flex-col overflow-y-auto bg-[#f8f7f4]">
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mx-auto mt-5 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-[#f8fafc]"
        >
          {isFetchingNextPage ? 'Loading…' : 'Load older messages'}
        </button>
      )}

      <div className="flex flex-1 flex-col gap-0 px-3 py-4 md:px-4">
        {allMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
