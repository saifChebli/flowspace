'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import type { Message } from '@/types';

interface MemberInfo {
  user: { id: string; name: string; avatarUrl: string | null };
  role: string;
}

export default function MessageInput({
  channelId,
  members = [],
}: {
  channelId: string;
  members?: MemberInfo[];
}) {
  const [body, setBody] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { emit } = useSocket();
  const queryClient = useQueryClient();

  const filteredMembers = mentionQuery !== null
    ? members.filter((m) =>
        m.user.name.toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : [];

  const { mutate, isPending } = useMutation({
    mutationFn: (data: { body: string; mentionedUserIds?: string[] }) =>
      api.post(`/channels/${channelId}/messages`, data).then((r) => r.data as Message),
    onSuccess: (message) => {
      // Broadcast to other users via socket
      emit('message:new', { channelId, message });
      // Add to own cache immediately (socket.to excludes the sender)
      queryClient.setQueryData<{ pages: { messages: Message[]; nextCursor?: string }[]; pageParams: unknown[] }>(
        ['messages', channelId],
        (old) => {
          if (!old) return old;
          const pages = [...old.pages];
          const lastIdx = pages.length - 1;
          pages[lastIdx] = {
            ...pages[lastIdx],
            messages: [...pages[lastIdx].messages, message],
          };
          return { ...old, pages };
        }
      );
      setBody('');
      setMentionedUserIds([]);
      setMentionQuery(null);
    },
  });

  const send = useCallback(() => {
    const text = body.trim();
    if (!text) return;
    mutate({
      body: text,
      ...(mentionedUserIds.length ? { mentionedUserIds } : {}),
    });
  }, [body, mentionedUserIds, mutate]);

  function insertMention(member: MemberInfo) {
    const ta = textareaRef.current;
    if (!ta) return;
    const cursor = ta.selectionStart;
    // Find the @ that started this mention
    const before = body.slice(0, cursor);
    const atIdx = before.lastIndexOf('@');
    if (atIdx < 0) return;

    const insert = `@${member.user.name} `;
    const newBody = body.slice(0, atIdx) + insert + body.slice(cursor);
    setBody(newBody);
    setMentionedUserIds((prev) =>
      prev.includes(member.user.id) ? prev : [...prev, member.user.id]
    );
    setMentionQuery(null);
    setMentionIndex(0);

    // Restore focus + cursor
    requestAnimationFrame(() => {
      ta.focus();
      const pos = atIdx + insert.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setBody(val);

    // Detect @mention trigger
    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);
    const atMatch = before.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Navigate mention dropdown
    if (mentionQuery !== null && filteredMembers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((i) => Math.min(i + 1, filteredMembers.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMembers[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // Close mention dropdown on blur after a short delay (so click on item works)
  const blurTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  function handleBlur() {
    blurTimer.current = setTimeout(() => setMentionQuery(null), 200);
  }
  function handleFocus() {
    clearTimeout(blurTimer.current);
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); send(); }}
      className="relative border-t border-border/60 bg-white px-4 py-3"
    >
      {/* Mention autocomplete dropdown */}
      {mentionQuery !== null && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 z-20 mb-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
          {filteredMembers.map((m, idx) => (
            <button
              key={m.user.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertMention(m)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                idx === mentionIndex ? 'bg-accent-soft text-accent' : 'text-foreground hover:bg-muted/40'
              }`}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-soft text-[9px] font-semibold text-accent">
                {m.user.name.charAt(0)}
              </div>
              <span className="truncate text-sm font-medium">{m.user.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{m.role}</span>
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-card/60 p-2.5">
        <textarea
          ref={textareaRef}
          value={body}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          rows={2}
          placeholder="Message this channel — type @ to mention"
          className="min-h-14 w-full resize-none bg-transparent px-1 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground/60">
            Enter to send, Shift+Enter for newline
          </span>
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent/85 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </button>
        </div>
      </div>
    </form>
  );
}
