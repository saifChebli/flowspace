'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Task } from '@/types';

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  URGENT: 'bg-red-100 text-red-700',
};

interface TaskWithComments extends Task {
  comments?: { id: string; body: string; createdAt: string; author: { id: string; name: string; avatarUrl: string | null } }[];
  attachments?: { file: { id: string; name: string; mimeType: string; url: string } }[];
}

interface Props {
  taskId: string;
  projectId: string;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, projectId, onClose }: Props) {
  const queryClient = useQueryClient();

  const { data: task, isLoading } = useQuery<TaskWithComments>({
    queryKey: ['task', taskId],
    queryFn: () => api.get(`/tasks/${taskId}`).then((r) => r.data),
  });

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
    }
  }, [task]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const updateTask = useMutation({
    mutationFn: () =>
      api.patch(`/tasks/${taskId}`, {
        title,
        description: description || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
      setEditing(false);
    },
  });

  const deleteTask = useMutation({
    mutationFn: () => api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
      onClose();
    },
  });

  const addComment = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/comments`, { body: comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setComment('');
    },
  });

  if (!task && !isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-12" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl rounded-[1.8rem] border border-border/80 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/70 px-6 py-5">
          <div className="flex-1">
            {editing ? (
              <input
                className="w-full border-b border-accent/40 bg-transparent pb-1 text-lg font-semibold outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            ) : (
              <h2 className="text-lg font-semibold text-foreground">{isLoading ? '…' : task?.title}</h2>
            )}
            {task && (
              <p className="mt-1 text-xs text-muted-foreground">
                {task.completedAt ? '✅ Completed' : '🔵 In progress'}
              </p>
            )}
          </div>
          <div className="ml-3 flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : task ? (
          <div className="px-6 py-5">
            <div className="grid gap-5 md:grid-cols-[1fr_200px]">
              {/* Main content */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Description
                  </label>
                  {editing ? (
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a description…"
                      className="w-full resize-none rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-accent/40"
                    />
                  ) : (
                    <p className="text-sm leading-6 text-muted-foreground">
                      {task.description ?? <span className="italic">No description</span>}
                    </p>
                  )}
                </div>

                {/* Comments */}
                <div>
                  <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Comments ({task.comments?.length ?? 0})
                  </label>
                  <div className="space-y-3">
                    {task.comments?.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
                          {c.author.name.charAt(0)}
                        </div>
                        <div className="flex-1 rounded-xl bg-muted/40 px-3 py-2">
                          <span className="text-xs font-semibold">{c.author.name}</span>
                          <p className="mt-1 text-sm leading-5">{c.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && comment.trim()) { e.preventDefault(); addComment.mutate(); } }}
                      placeholder="Add a comment…"
                      className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent/40"
                    />
                    <button
                      onClick={() => { if (comment.trim()) addComment.mutate(); }}
                      disabled={addComment.isPending || !comment.trim()}
                      className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Priority
                  </label>
                  {editing ? (
                    <div className="space-y-1">
                      {PRIORITY_OPTIONS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                            priority === p ? PRIORITY_COLORS[p] : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Due date
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent/40"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                    </p>
                  )}
                </div>

                {task.assignees && task.assignees.length > 0 && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Assignees
                    </label>
                    <div className="space-y-2">
                      {task.assignees.map(({ user }) => (
                        <div key={user.id} className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-200 text-xs font-semibold text-indigo-800">
                            {user.name.charAt(0)}
                          </div>
                          <span className="text-sm">{user.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {task.labels && task.labels.length > 0 && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Labels
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {task.labels.map((label) => (
                        <span key={label} className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10px] font-medium text-[#4f46e5]">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action bar */}
            <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
              {editing ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateTask.mutate()}
                    disabled={updateTask.isPending}
                    className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {updateTask.isPending ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div />
              )}
              <button
                onClick={() => { if (confirm('Delete this task?')) deleteTask.mutate(); }}
                disabled={deleteTask.isPending}
                className="rounded-xl border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/5 disabled:opacity-50"
              >
                {deleteTask.isPending ? 'Deleting…' : 'Delete task'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
