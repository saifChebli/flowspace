'use client';

import type { Board, BoardList, Task } from '@/types';

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

export default function KanbanBoard({ board }: KanbanBoardProps) {
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
        <KanbanList key={list.id} list={list} />
      ))}
      </div>
    </div>
  );
}

function KanbanList({ list }: { list: BoardList }) {
  return (
    <div className="flex w-80 shrink-0 flex-col rounded-3xl border border-[#d8dee7] bg-[#f7f8fa] shadow-[0_10px_22px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-4">
        <div>
          <span className="text-sm font-semibold text-[#0f172a]">{list.name}</span>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-muted-foreground shadow-sm">
          {list.tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {list.tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        <button className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white/70 px-4 py-3 text-left text-sm font-medium text-muted-foreground transition hover:border-[#94a3b8] hover:bg-white">
          + Add task
        </button>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const checklistTotal = getChecklistTotal(task);
  const checklistDone = getChecklistDone(task, checklistTotal);
  const attachmentCount = getAttachmentCount(task);
  const commentCount = getCommentCount(task);

  return (
    <div className="cursor-pointer rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
      <p className="text-sm font-semibold leading-snug text-[#111827]">{task.title}</p>

      {task.description && (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#64748b]">{task.description}</p>
      )}

      {task.dueDate && (
        <p className="mt-2 text-xs text-muted-foreground" suppressHydrationWarning>
          Due {dueDateFormatter.format(new Date(task.dueDate))}
        </p>
      )}

      <div className="mt-3 rounded-[0.9rem] bg-[#f8fafc] p-3">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
          <span>Checklist</span>
          <span>
            {checklistDone}/{checklistTotal}
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-[#e2e8f0]">
          <div
            className="h-2 rounded-full bg-[#4f46e5]"
            style={{ width: `${Math.max(18, (checklistDone / checklistTotal) * 100)}%` }}
          />
        </div>
        <div className="mt-3 space-y-1.5">
          {buildChecklistPreview(task, checklistDone).map((item, index) => (
            <div key={`${task.id}-${item}`} className="flex items-center gap-2 text-sm text-[#475569]">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                  index < checklistDone
                    ? 'border-[#4f46e5] bg-[#eef2ff] text-[#4f46e5]'
                    : 'border-[#cbd5e1] bg-white text-transparent'
                }`}
              >
                •
              </span>
              <span className="truncate">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            PRIORITY_COLORS[task.priority]
          }`}
        >
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

      <div className="mt-3 flex items-center justify-between border-t border-[#eef2f7] pt-3 text-xs text-[#64748b]">
        <div className="flex items-center gap-3">
          <span>{attachmentCount} files</span>
          <span>{commentCount} notes</span>
        </div>
        <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 font-semibold text-[#475569]">
          Task
        </span>
      </div>

      {task.labels && task.labels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {task.labels.map((label) => (
            <span
              key={label}
              className="rounded-full bg-[#eef2ff] px-2 py-0.5 text-[10px] font-medium text-[#4f46e5]"
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function metricSeed(task: Task): number {
  return Array.from(`${task.id}${task.title}${task.labels.join('')}`).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  );
}

function getChecklistTotal(task: Task): number {
  return Math.max(3, (metricSeed(task) % 4) + 3);
}

function getChecklistDone(task: Task, total: number): number {
  return Math.min(total - 1, (metricSeed(task) % total) + 1);
}

function getAttachmentCount(task: Task): number {
  return (metricSeed(task) % 3) + 1;
}

function getCommentCount(task: Task): number {
  return ((metricSeed(task) >> 1) % 4) + 1;
}

function buildChecklistPreview(task: Task, checklistDone: number): string[] {
  const labelItems = task.labels.slice(0, 2).map((label) => `${label} update`);
  const defaults = ['Scope review', 'Stakeholder check', 'Final pass'];
  const combined = [...labelItems, ...defaults];
  return combined.slice(0, Math.max(2, checklistDone));
}
