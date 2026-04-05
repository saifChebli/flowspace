'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Pencil, Trash2, X, Send } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useSocket } from '@/hooks/useSocket';
import type { Message } from '@/types';

const messageTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

function highlightMentions(text: string): ReactNode[] {
  const parts = text.split(/(@\w[\w\s]*?)(?=\s@|\s*$|[.,!?])/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="rounded bg-accent/10 px-0.5 font-semibold text-accent">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function MessageBubble({
  message,
  channelId,
}: {
  message: Message;
  channelId: string;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { emit } = useSocket();
  const isOwn = message.author.id === user?.id;
  const isDeleted = message.body === '[deleted]';
  const replyCount = message._count?.replies ?? 0;

  const [editMode, setEditMode] = useState(false);
  const [editBody, setEditBody] = useState(message.body);
  const [showThread, setShowThread] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const editRef = useRef<HTMLTextAreaElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editMode) editRef.current?.focus();
  }, [editMode]);

  useEffect(() => {
    if (showThread) replyRef.current?.focus();
  }, [showThread]);

  const editMutation = useMutation({
    mutationFn: (body: string) =>
      api.patch(`/channels/${channelId}/messages/${message.id}`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      setEditMode(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      api.delete(`/channels/${channelId}/messages/${message.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
    },
  });

  // Thread replies query (only when expanded)
  const { data: threadData } = useQuery<{ replies: Message[]; parent: Message }>({
    queryKey: ['thread', message.id],
    queryFn: () =>
      api.get(`/channels/${channelId}/messages/${message.id}/thread`).then((r) => r.data),
    enabled: showThread,
  });

  const replyMutation = useMutation({
    mutationFn: (data: { body: string; parentId: string }) =>
      api.post(`/channels/${channelId}/messages`, data).then((r) => r.data as Message),
    onSuccess: (reply) => {
      emit('message:new', { channelId, message: reply });
      queryClient.invalidateQueries({ queryKey: ['thread', message.id] });
      queryClient.invalidateQueries({ queryKey: ['messages', channelId] });
      setReplyBody('');
    },
  });

  function handleEditSave() {
    const trimmed = editBody.trim();
    if (!trimmed || trimmed === message.body) {
      setEditMode(false);
      return;
    }
    editMutation.mutate(trimmed);
  }

  function handleReplySend() {
    const text = replyBody.trim();
    if (!text) return;
    replyMutation.mutate({ body: text, parentId: message.id });
  }

  return (
    <div>
      <div
        className={`group flex items-start gap-2.5 rounded-lg px-2 py-2 my-1 transition-colors hover:bg-muted/30 ${
          isOwn ? 'bg-accent-soft/15' : ''
        }`}
      >
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-semibold text-accent">
          {message.author.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-foreground">
              {message.author.name}
            </span>
            {isOwn && (
              <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[9px] font-semibold text-accent">
                You
              </span>
            )}
            <span className="text-[11px] text-muted-foreground" suppressHydrationWarning>
              {messageTimeFormatter.format(new Date(message.createdAt))}
            </span>
            {message.editedAt && !isDeleted && (
              <span className="text-[10px] italic text-muted-foreground">(edited)</span>
            )}

            {/* Hover actions */}
            {!isDeleted && !editMode && (
              <span className="ml-auto hidden items-center gap-0.5 group-hover:flex">
                <button
                  onClick={() => setShowThread((v) => !v)}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent-soft hover:text-accent"
                  title="Thread"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
                {isOwn && (
                  <>
                    <button
                      onClick={() => { setEditBody(message.body); setEditMode(true); }}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this message?')) deleteMutation.mutate(); }}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </span>
            )}
          </div>

          {editMode ? (
            <div className="mt-1.5">
              <textarea
                ref={editRef}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
                  if (e.key === 'Escape') setEditMode(false);
                }}
                rows={2}
                className="field-input w-full resize-none text-sm"
              />
              <div className="mt-1.5 flex gap-1.5">
                <button
                  onClick={handleEditSave}
                  disabled={editMutation.isPending}
                  className="primary-button px-3 py-1 text-xs disabled:opacity-50"
                >
                  {editMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="secondary-button px-3 py-1 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : isDeleted ? (
            <p className="mt-0.5 text-sm italic text-muted-foreground">[message deleted]</p>
          ) : (
            <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
              {highlightMentions(message.body)}
            </p>
          )}

          {/* Reply count indicator */}
          {replyCount > 0 && !showThread && (
            <button
              onClick={() => setShowThread(true)}
              className="mt-1 flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent/80"
            >
              <MessageSquare className="h-3 w-3" />
              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>

      {/* Inline thread panel */}
      {showThread && (
        <div className="mb-2 ml-10 rounded-lg border border-border/50 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              Thread ({threadData?.replies?.length ?? replyCount})
            </span>
            <button
              onClick={() => setShowThread(false)}
              className="rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Thread replies */}
          <div className="space-y-2">
            {threadData?.replies?.map((reply) => (
              <div key={reply.id} className="flex items-start gap-2">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent-soft text-[8px] font-semibold text-accent">
                  {reply.author.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-semibold text-foreground">{reply.author.name}</span>
                    <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                      {messageTimeFormatter.format(new Date(reply.createdAt))}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-xs leading-5 text-foreground/80">
                    {highlightMentions(reply.body)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply form */}
          <div className="mt-2.5 flex gap-2">
            <textarea
              ref={replyRef}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReplySend(); }
              }}
              rows={1}
              placeholder="Reply in thread..."
              className="field-input flex-1 resize-none py-1.5 text-xs"
            />
            <button
              onClick={handleReplySend}
              disabled={replyMutation.isPending || !replyBody.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent/80 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
