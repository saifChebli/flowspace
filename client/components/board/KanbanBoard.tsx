'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Board, BoardList, Task } from '@/types';
import TaskDetailModal from './TaskDetailModal';

const dueDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-700',
  URGENT: 'bg-red-100 text-red-700',
};

interface KanbanBoardProps {
  board: Board;
  projectId: string;
}

export default function KanbanBoard({ board, projectId }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [addingList, setAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const createList = useMutation({
    mutationFn: (name: string) =>
      api.post(`/projects/${projectId}/boards/${board.id}/lists`, {
        name,
        position: board.lists.length,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
      setNewListName('');
      setAddingList(false);
    },
  });

  function handleAddList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim()) return;
    createList.mutate(newListName.trim());
  }

  return (
    <div className="min-h-[72vh] rounded-[1.8rem] bg-[#eceff3] p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Project board
          </p>
          <h3 className="mt-1 text-xl font-semibold text-[#111827]">{board.name}</h3>
        </div>
        <div className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          {board.lists.length} lists
        </div>
      </div>

      <div className="flex h-full gap-4 overflow-x-auto pb-2">
        {board.lists.map((list) => (
          <KanbanList key={list.id} list={list} projectId={projectId} onTaskClick={setSelectedTaskId} />
        ))}

        {/* Add list column */}
        {addingList ? (
          <form
            onSubmit={handleAddList}
            className="flex w-64 shrink-0 flex-col gap-2 rounded-3xl border border-dashed border-[#d0d7e2] bg-white/70 p-4"
          >
            <input
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name…"
              className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent/40"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createList.isPending || !newListName.trim()}
                className="flex-1 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {createList.isPending ? 'Adding…' : 'Add list'}
              </button>
              <button
                type="button"
                onClick={() => { setAddingList(false); setNewListName(''); }}
                className="rounded-xl border border-border bg-white px-3 py-2 text-xs text-muted-foreground"
              >
                ✕
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAddingList(true)}
            className="flex h-14 w-48 shrink-0 items-center justify-center rounded-3xl border-2 border-dashed border-[#d0d7e2] bg-white/40 text-sm font-semibold text-muted-foreground transition hover:border-accent/40 hover:bg-white/70 hover:text-accent"
          >
            + Add list
          </button>
        )}
      </div>

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          projectId={projectId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}

function KanbanList({
  list,
  projectId,
  onTaskClick,
}: {
  list: BoardList;
  projectId: string;
  onTaskClick: (taskId: string) => void;
}) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  const createTask = useMutation({
    mutationFn: (taskTitle: string) =>
      api.post(`/lists/${list.id}/tasks`, {
        title: taskTitle,
        position: list.tasks.length,
        priority: 'MEDIUM',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
      setTitle('');
      setAdding(false);
    },
  });

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createTask.mutate(title.trim());
  }

  return (
    <div className="flex w-80 shrink-0 flex-col rounded-3xl border border-[#d8dee7] bg-[#f7f8fa] shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-4">
        <span className="text-sm font-semibold text-[#0f172a]">{list.name}</span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-muted-foreground shadow-sm">
          {list.tasks.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {list.tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
        ))}

        {/* Inline add task form */}
        {adding ? (
          <form onSubmit={handleAddTask} className="mt-1 flex flex-col gap-2">
            <textarea
              autoFocus
              rows={2}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (title.trim()) createTask.mutate(title.trim()); } }}
              placeholder="Task title…"
              className="resize-none rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent/40"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createTask.isPending || !title.trim()}
                className="flex-1 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {createTask.isPending ? 'Adding…' : 'Add task'}
              </button>
              <button
                type="button"
                onClick={() => { setAdding(false); setTitle(''); }}
                className="rounded-xl border border-border bg-white px-3 py-2 text-xs text-muted-foreground"
              >
                ✕
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white/70 px-4 py-3 text-left text-sm font-medium text-muted-foreground transition hover:border-[#94a3b8] hover:bg-white"
          >
            + Add task
          </button>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const attachmentCount = (task as Task & { attachments?: unknown[] }).attachments?.length ?? 0;
  const commentCount = (task as Task & { comments?: unknown[] }).comments?.length ?? 0;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
    >
      <p className="text-sm font-semibold leading-snug text-[#111827]">{task.title}</p>

      {task.description && (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#64748b]">{task.description}</p>
      )}

      {task.dueDate && (
        <p className="mt-2 text-xs text-muted-foreground" suppressHydrationWarning>
          Due {dueDateFormatter.format(new Date(task.dueDate))}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>

        {task.assignees && task.assignees.length > 0 && (
          <div className="ml-auto flex -space-x-1.5">
            {task.assignees.slice(0, 3).map(({ user }) => (
              <div
                key={user.id}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-200 text-[10px] font-semibold text-indigo-800 ring-1 ring-white"
                title={user.name}
              >
                {user.name.charAt(0)}
              </div>
            ))}
          </div>
        )}
      </div>

      {(attachmentCount > 0 || commentCount > 0) && (
        <div className="mt-3 flex items-center gap-3 border-t border-[#eef2f7] pt-3 text-xs text-[#64748b]">
          {attachmentCount > 0 && <span>📎 {attachmentCount}</span>}
          {commentCount > 0 && <span>💬 {commentCount}</span>}
        </div>
      )}

      {task.labels && task.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {task.labels.map((label) => (
            <span key={label} className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10px] font-medium text-[#4f46e5]">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

