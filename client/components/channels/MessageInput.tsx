'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import type { Message } from '@/types';

export default function MessageInput({ channelId }: { channelId: string }) {
  const [body, setBody] = useState('');
  const { emit } = useSocket();

  const { mutate, isPending } = useMutation({
    mutationFn: (text: string) =>
      api.post(`/channels/${channelId}/messages`, { body: text }).then((r) => r.data as Message),
    onSuccess: (message) => {
      // Emit to other clients via socket
      emit('message:new', { channelId, message });
      setBody('');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    mutate(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = body.trim();
      if (text) mutate(text);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border/70 bg-white px-4 py-4 md:px-6"
    >
      <div className="rounded-[1.4rem] border border-border bg-[#f8fafc] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder="Message this channel"
          className="min-h-20 w-full resize-none bg-transparent px-1 py-1 text-sm text-foreground outline-none"
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Enter to send, Shift+Enter for newline
          </div>
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="rounded-xl bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4338ca] disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </form>
  );
}
