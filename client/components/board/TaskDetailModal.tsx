'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { toast } from 'sonner';
import type { Task, TaskComment, TaskTimeEntry, Project } from '@/types';

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-accent-soft text-accent',
  HIGH: 'bg-[rgba(240,227,207,0.95)] text-gold',
  URGENT: 'bg-destructive/12 text-destructive',
};

const PRIORITY_DOTS: Record<string, string> = {
  LOW: 'bg-muted-foreground',
  MEDIUM: 'bg-accent',
  HIGH: 'bg-gold',
  URGENT: 'bg-destructive',
};

const LABEL_PALETTE = [
  'bg-accent/12 text-accent border-accent/20',
  'bg-gold/15 text-gold border-gold/25',
  'bg-[#e8d5f5]/60 text-[#7c3aed] border-[#7c3aed]/20',
  'bg-[#dbeafe]/60 text-[#2563eb] border-[#2563eb]/20',
  'bg-destructive/8 text-destructive border-destructive/20',
  'bg-[#d1fae5]/60 text-[#059669] border-[#059669]/20',
];

function labelColor(index: number) {
  return LABEL_PALETTE[index % LABEL_PALETTE.length];
}

function relativeTime(dateStr: string) {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function relativeDate(dateStr: string) {
  const today = new Date();
  const d = new Date(dateStr);
  const diffDay = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diffDay === 0) return 'today';
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

function progressColor(pct: number) {
  if (pct <= 75) return 'bg-accent';
  if (pct <= 100) return 'bg-[#d97706]';
  return 'bg-destructive';
}

interface TaskDetail extends Task {
  comments?: TaskComment[];
  timeEntries?: TaskTimeEntry[];
  attachments?: { file: { id: string; name: string; mimeType: string; url: string } }[];
}

interface Props {
  taskId: string;
  projectId: string;
  onClose: () => void;
}

export default function TaskDetailModal({ taskId, projectId, onClose }: Props) {
  const queryClient = useQueryClient();
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const currentUser = useAuthStore((s) => s.user);

  const { data: task, isLoading } = useQuery<TaskDetail>({
    queryKey: ['task', taskId],
    queryFn: () => api.get(`/tasks/${taskId}`).then((r) => r.data),
  });

  const { data: project } = useQuery<Project>({
    queryKey: ['project', workspaceSlug, projectId, 'members'],
    queryFn: () => api.get(`/workspaces/${workspaceSlug}/projects/${projectId}`).then((r) => r.data),
  });

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [comment, setComment] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [labelInputVisible, setLabelInputVisible] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState('');
  const [timeMinutes, setTimeMinutes] = useState('');
  const [timeNote, setTimeNote] = useState('');
  const [timeLogged, setTimeLogged] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
      setEstimatedMinutes(task.estimatedMinutes != null ? String(task.estimatedMinutes) : '');
    }
  }, [task]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
  };

  // ─── Task mutations ───────────────────────────────────────────────────
  const updateTask = useMutation({
    mutationFn: (patch: Record<string, unknown>) => api.patch(`/tasks/${taskId}`, patch),
    onSuccess: invalidateAll,
  });

  const deleteTask = useMutation({
    mutationFn: () => api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
      onClose();
    },
  });

  // ─── Comment mutations ────────────────────────────────────────────────
  const addComment = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/comments`, { body: comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setComment('');
    },
  });

  const editComment = useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      api.patch(`/tasks/comments/${commentId}`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setEditingCommentId(null);
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) => api.delete(`/tasks/comments/${commentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
  });

  // ─── Time entry mutations ─────────────────────────────────────────────
  const logTime = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/time`, { minutes: Number(timeMinutes), note: timeNote || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setTimeMinutes('');
      setTimeNote('');
      setTimeLogged(true);
      setTimeout(() => setTimeLogged(false), 2000);
    },
  });

  const deleteTimeEntry = useMutation({
    mutationFn: (entryId: string) => api.delete(`/tasks/time/${entryId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', taskId] }),
  });

  // ─── Derived data ─────────────────────────────────────────────────────
  const totalTracked = useMemo(
    () => task?.timeEntries?.reduce((sum, e) => sum + e.minutes, 0) ?? 0,
    [task?.timeEntries]
  );

  const assigneeIds = useMemo(
    () => new Set(task?.assignees?.map((a) => a.user.id) ?? []),
    [task?.assignees]
  );

  // ─── Assignee toggle ──────────────────────────────────────────────────
  function toggleAssignee(userId: string) {
    const currentIds = task?.assignees?.map((a) => a.user.id) ?? [];
    const newIds = assigneeIds.has(userId)
      ? currentIds.filter((id) => id !== userId)
      : [...currentIds, userId];
    updateTask.mutate({ assigneeIds: newIds });
  }

  // ─── Label add / remove ───────────────────────────────────────────────
  function addLabel(e: React.FormEvent) {
    e.preventDefault();
    const label = newLabel.trim();
    if (!label || task?.labels.includes(label)) { setNewLabel(''); return; }
    updateTask.mutate({ labels: [...(task?.labels ?? []), label] });
    setNewLabel('');
  }

  function removeLabel(label: string) {
    updateTask.mutate({ labels: (task?.labels ?? []).filter((l) => l !== label) });
  }

  // ─── Save edit form ───────────────────────────────────────────────────
  function handleSaveEdit() {
    updateTask.mutate(
      {
        title,
        description: description || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
      },
      { onSuccess: () => setEditing(false) }
    );
  }

  function formatMinutes(m: number) {
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const rem = m % 60;
      return rem ? `${h}h ${rem}m` : `${h}h`;
    }
    return `${m}m`;
  }

  if (!task && !isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="glass-card relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/70 px-6 py-5">
          <div className="flex-1">
            <div className="section-kicker">Task detail</div>
            {editing ? (
              <input
                className="field-input mt-2 text-lg font-semibold"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            ) : (
              <h2 className="mt-1 text-lg font-semibold text-foreground">{isLoading ? '…' : task?.title}</h2>
            )}
            {task && (
              <p className="mt-1 text-xs text-muted-foreground">
                {task.completedAt ? 'Completed' : 'In progress'}
              </p>
            )}
          </div>
          <div className="ml-3 flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-border px-3.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : task ? (
          <div className="overflow-y-auto overscroll-contain px-6 py-5">
            <div className="grid gap-6 md:grid-cols-[1fr_230px]">
              {/* ═══ Main column ═══ */}
              <div className="space-y-6">
                {/* Description */}
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
                      className="field-input resize-none"
                    />
                  ) : (
                    <div className="soft-row rounded-lg px-4 py-3">
                      <p className="text-sm leading-6 text-muted-foreground">
                        {task.description ?? <span className="italic">No description</span>}
                      </p>
                    </div>
                  )}
                </div>

                {/* ─── Time tracking ─────────────────────────────── */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Time tracking (minutes)
                  </label>

                  {/* Progress bar */}
                  {task.estimatedMinutes != null && task.estimatedMinutes > 0 && (
                    <div className="mb-3 rounded-xl bg-muted/40 px-3.5 py-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Tracked: <span className="font-semibold text-foreground">{formatMinutes(totalTracked)}</span></span>
                        <span>Estimated: <span className="font-semibold text-foreground">{formatMinutes(task.estimatedMinutes)}</span></span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${progressColor(
                            (totalTracked / task.estimatedMinutes) * 100
                          )}`}
                          style={{ width: `${Math.min(110, (totalTracked / task.estimatedMinutes) * 100)}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-right text-[10px] text-muted-foreground">
                        {Math.round((totalTracked / task.estimatedMinutes) * 100)}% complete
                      </p>
                    </div>
                  )}
                  {task.estimatedMinutes == null && totalTracked > 0 && (
                    <p className="mb-2 text-xs text-muted-foreground">
                      Total tracked: <span className="font-semibold text-foreground">{formatMinutes(totalTracked)}</span>
                    </p>
                  )}

                  {/* Log time form */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={1440}
                        placeholder="0"
                        value={timeMinutes}
                        onChange={(e) => setTimeMinutes(e.target.value)}
                        className="field-input w-20 pr-8 text-center"
                      />
                      {/* <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">min</span> */}
                    </div>
                    <input
                      placeholder="Note (optional)"
                      value={timeNote}
                      onChange={(e) => setTimeNote(e.target.value)}
                      className="field-input flex-1"
                    />
                    <button
                      onClick={() => { if (Number(timeMinutes) > 0) logTime.mutate(); }}
                      disabled={logTime.isPending || !timeMinutes || Number(timeMinutes) <= 0}
                      className="primary-button flex h-9 items-center gap-1.5 px-3.5 text-xs disabled:opacity-50"
                    >
                      {logTime.isPending ? '…' : timeLogged ? '✓ Logged' : '+ Log'}
                    </button>
                  </div>

                  {/* Time entries */}
                  {task.timeEntries && task.timeEntries.length > 0 && (
                    <div className="mt-3 max-h-36 space-y-1.5 overflow-y-auto">
                      {task.timeEntries.map((entry) => (
                        <div key={entry.id} className="soft-row flex items-center justify-between rounded-xl px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="icon-chip flex h-6 w-6 text-[10px] font-bold">{entry.user.name.charAt(0)}</div>
                            <span className="text-xs font-semibold">{entry.user.name}</span>
                            <span className="pill-muted px-2 py-0.5 text-[11px] font-semibold">{formatMinutes(entry.minutes)}</span>
                            {entry.note && <span className="text-xs text-muted-foreground">{entry.note}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground" suppressHydrationWarning>
                              {relativeDate(entry.date)}
                            </span>
                            {entry.user.id === currentUser?.id && (
                              <button
                                onClick={() => deleteTimeEntry.mutate(entry.id)}
                                className="flex h-6 w-6 items-center justify-center rounded-lg text-xs text-destructive/60 transition hover:bg-destructive/8 hover:text-destructive"
                                title="Delete entry"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ─── Comments ───────────────────────────────────── */}
                <div>
                  <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Comments ({task.comments?.length ?? 0})
                  </label>
                  <div className="space-y-3">
                    {task.comments?.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <div className="icon-chip flex h-8 w-8 shrink-0 text-xs font-bold">
                          {c.author.name.charAt(0)}
                        </div>
                        <div className="soft-row flex-1 rounded-xl px-3.5 py-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold">{c.author.name}</span>
                              <span className="text-[11px] text-muted-foreground" suppressHydrationWarning>
                                {relativeTime(c.createdAt)}
                              </span>
                              {c.editedAt && <span className="text-[10px] italic text-muted-foreground">(edited)</span>}
                            </div>
                            {c.author.id === currentUser?.id && editingCommentId !== c.id && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => { setEditingCommentId(c.id); setEditingCommentBody(c.body); }}
                                  className="flex h-7 items-center rounded-lg px-2 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => toast('Delete this comment?', { action: { label: 'Delete', onClick: () => deleteComment.mutate(c.id) } })}
                                  className="flex h-7 items-center rounded-lg px-2 text-xs text-destructive/60 transition hover:bg-destructive/8 hover:text-destructive"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                          {editingCommentId === c.id ? (
                            <div className="mt-2 space-y-2">
                              <textarea
                                rows={2}
                                value={editingCommentBody}
                                onChange={(e) => setEditingCommentBody(e.target.value)}
                                className="field-input resize-none text-sm"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => editComment.mutate({ commentId: c.id, body: editingCommentBody })}
                                  disabled={editComment.isPending || !editingCommentBody.trim()}
                                  className="primary-button h-8 px-3.5 text-xs disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingCommentId(null)}
                                  className="secondary-button h-8 px-3.5 text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">{c.body}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* New comment textarea */}
                  <div className="mt-4 flex gap-3">
                    <div className="icon-chip flex h-8 w-8 shrink-0 text-xs font-bold">
                      {currentUser?.name?.charAt(0) ?? '?'}
                    </div>
                    <div className="flex-1">
                      <textarea
                        ref={commentRef}
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey && comment.trim()) {
                            e.preventDefault();
                            addComment.mutate();
                          }
                        }}
                        placeholder="Write a comment… (Shift+Enter for new line)"
                        className="field-input resize-none text-sm"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Enter to send · Shift+Enter for new line</span>
                        <button
                          onClick={() => { if (comment.trim()) addComment.mutate(); }}
                          disabled={addComment.isPending || !comment.trim()}
                          className="primary-button flex h-8 items-center gap-1.5 px-4 text-xs disabled:opacity-50"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                          {addComment.isPending ? 'Sending…' : 'Send'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ Sidebar ═══ */}
              <div className="space-y-5">
                {/* Priority */}
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
                          className={`flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-xs font-semibold transition ${
                            priority === p ? PRIORITY_COLORS[p] : 'soft-row text-muted-foreground hover:bg-card'
                          }`}
                        >
                          <span className={`h-2.5 w-2.5 rounded-full ${PRIORITY_DOTS[p]}`} />
                          {p}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${PRIORITY_DOTS[task.priority]}`} />
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                  )}
                </div>

                {/* Due date */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Due date
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="field-input h-9"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                    </p>
                  )}
                </div>

                {/* Estimated time (edit mode) */}
                {editing && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Estimate (minutes)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(e.target.value)}
                      placeholder="e.g. 120"
                      className="field-input h-9"
                    />
                  </div>
                )}

                {/* Assignees */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Assignees
                  </label>
                  {/* Avatar row */}
                  {task.assignees && task.assignees.length > 0 ? (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {task.assignees.map(({ user }) => (
                        <button
                          key={user.id}
                          onClick={() => toggleAssignee(user.id)}
                          className="group relative"
                          title={`${user.name} — click to remove`}
                        >
                          <div className="icon-chip flex h-8 w-8 text-xs font-semibold ring-2 ring-accent/30 transition group-hover:ring-destructive/40">
                            {user.name.charAt(0)}
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => setShowAllMembers(!showAllMembers)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-border text-xs text-muted-foreground transition hover:border-accent/40 hover:text-foreground"
                        title="Add assignee"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAllMembers(!showAllMembers)}
                      className="mb-2 flex h-9 items-center gap-2 rounded-xl border border-dashed border-border px-3 text-xs text-muted-foreground transition hover:border-accent/40 hover:text-foreground"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-current text-[10px]">+</span>
                      Assign someone
                    </button>
                  )}
                  {/* Expandable member list */}
                  {showAllMembers && (
                    <div className="space-y-1 rounded-xl border border-border/60 bg-card/50 p-2">
                      {project?.members?.map(({ user }) => {
                        const isAssigned = assigneeIds.has(user.id);
                        return (
                          <button
                            key={user.id}
                            onClick={() => toggleAssignee(user.id)}
                            className={`flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left transition ${
                              isAssigned
                                ? 'bg-accent-soft text-accent'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            <div className="icon-chip flex h-6 w-6 text-[10px] font-semibold">
                              {user.name.charAt(0)}
                            </div>
                            <span className="flex-1 truncate text-xs">{user.name}</span>
                            {isAssigned && <span className="text-xs">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Labels */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Labels
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {task.labels.map((label, idx) => (
                      <span
                        key={label}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${labelColor(idx)}`}
                      >
                        {label}
                        <button
                          onClick={() => removeLabel(label)}
                          className="ml-0.5 opacity-60 transition hover:opacity-100"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                  {labelInputVisible ? (
                    <form onSubmit={addLabel} className="mt-2 flex gap-1.5">
                      <input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        onBlur={() => { if (!newLabel.trim()) setLabelInputVisible(false); }}
                        placeholder="Label name…"
                        maxLength={30}
                        className="field-input flex-1 py-1.5 text-xs"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!newLabel.trim()}
                        className="secondary-button flex h-8 w-8 items-center justify-center text-sm disabled:opacity-40"
                      >
                        +
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setLabelInputVisible(true)}
                      className="mt-2 flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      + Add label
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
              {editing ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={updateTask.isPending}
                    className="primary-button flex h-9 items-center gap-1.5 px-5 text-sm disabled:opacity-50"
                  >
                    {updateTask.isPending ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="secondary-button h-9 px-4 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div />
              )}
              <button
                onClick={() => toast('Delete this task?', { action: { label: 'Delete', onClick: () => deleteTask.mutate() } })}
                disabled={deleteTask.isPending}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-destructive/30 px-4 text-sm font-semibold text-destructive transition hover:bg-destructive/5 disabled:opacity-50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                {deleteTask.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
