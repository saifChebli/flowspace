'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useSocket } from '@/hooks/useSocket';
import { Plus } from 'lucide-react';
import type { Board, BoardList, Task, Project } from '@/types';
import TaskDetailModal from './TaskDetailModal';

const dueDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'pill-muted',
  MEDIUM: 'pill-accent',
  HIGH: 'pill-gold',
  URGENT: 'bg-destructive/12 text-destructive',
};

const LIST_ACCENTS = [
  'from-[#f7ecda] to-[#fff8ee]',
  'from-[#e3f1eb] to-[#f9fcfa]',
  'from-[#eee6da] to-[#fff9f1]',
  'from-[#f2e6de] to-[#fff7f3]',
];

interface KanbanBoardProps {
  board: Board;
  projectId: string;
  readOnly?: boolean;
}

export default function KanbanBoard({ board, projectId, readOnly = false }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const [addingList, setAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { data: project } = useQuery<Project>({
    queryKey: ['project', workspaceSlug, projectId, 'members'],
    queryFn: () => api.get(`/workspaces/${workspaceSlug}/projects/${projectId}`).then((r) => r.data),
  });

  const members = project?.members ?? [];

  // ─── Real-time socket sync ────────────────────────────────────────────
  const { joinProject, leaveProject, on } = useSocket();

  useEffect(() => {
    joinProject(projectId);
    const offUpdated = on('task:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
    });
    const offMoved = on('task:moved', () => {
      queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
    });
    return () => {
      leaveProject(projectId);
      offUpdated?.();
      offMoved?.();
    };
  }, [projectId, joinProject, leaveProject, on, queryClient]);

  // ─── Filter state (declared before sensors — drag depends on it) ──────
  const [fAssignee, setFAssignee] = useState('');
  const [fPriority, setFPriority] = useState('');
  const [fLabel, setFLabel] = useState('');
  const [fDue, setFDue] = useState('');
  const [fText, setFText] = useState('');
  const filtersActive = !!(fAssignee || fPriority || fLabel || fDue || fText);

  // ─── DnD sensors ──────────────────────────────────────────────────────
  // Filtering hides cards, so visible order no longer matches stored positions —
  // disable dragging until filters are cleared rather than persist a wrong index.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: readOnly || filtersActive ? Infinity : 5 } })
  );

  // Build a flat map of taskId → task for quick lookup
  const taskMap = useMemo(() => {
    const map = new Map<string, Task>();
    for (const list of board.lists) {
      for (const task of list.tasks) map.set(task.id, task);
    }
    return map;
  }, [board.lists]);

  // ─── Filters (Pro) ───────────────────────────────────────────────────
  const { data: usage } = useQuery<{ plan: 'FREE' | 'PRO' | 'AGENCY' }>({
    queryKey: ['workspace-usage', workspaceSlug],
    queryFn: () => api.get(`/workspaces/${workspaceSlug}/usage`).then((r) => r.data),
  });
  const canFilter = usage ? usage.plan !== 'FREE' : false;

  const allLabels = useMemo(() => {
    const set = new Set<string>();
    for (const l of board.lists) for (const t of l.tasks) for (const lb of t.labels ?? []) set.add(lb);
    return [...set].sort();
  }, [board.lists]);

  const matches = useCallback(
    (task: Task): boolean => {
      if (fAssignee && !(task.assignees ?? []).some((a) => a.user.id === fAssignee)) return false;
      if (fPriority && task.priority !== fPriority) return false;
      if (fLabel && !(task.labels ?? []).includes(fLabel)) return false;
      if (fText) {
        const q = fText.toLowerCase();
        if (!task.title.toLowerCase().includes(q) && !(task.description ?? '').toLowerCase().includes(q)) return false;
      }
      if (fDue) {
        if (fDue === 'none') return !task.dueDate;
        if (!task.dueDate) return false;
        const due = new Date(task.dueDate);
        const now = new Date();
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        if (fDue === 'overdue' && !(due < now && !task.completedAt)) return false;
        if (fDue === 'today' && !(due <= endOfToday && due >= now)) return false;
        if (fDue === 'week' && !(due <= new Date(endOfToday.getTime() + 6 * 86400000) && due >= now)) return false;
      }
      return true;
    },
    [fAssignee, fPriority, fLabel, fDue, fText],
  );

  const visibleLists = useMemo(
    () => (filtersActive ? board.lists.map((l) => ({ ...l, tasks: l.tasks.filter(matches) })) : board.lists),
    [board.lists, filtersActive, matches],
  );

  const matchCount = useMemo(
    () => visibleLists.reduce((n, l) => n + l.tasks.length, 0),
    [visibleLists],
  );

  function clearFilters() {
    setFAssignee(''); setFPriority(''); setFLabel(''); setFDue(''); setFText('');
  }

  // List IDs for sortable context
  const listIds = useMemo(() => board.lists.map((l) => l.id), [board.lists]);

  // ─── DnD mutations ───────────────────────────────────────────────────
  const moveTask = useMutation({
    mutationFn: ({ taskId, listId, position }: { taskId: string; listId: string; position: number }) =>
      api.post(`/tasks/${taskId}/move`, { listId, position }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
    },
    onError: (err: unknown) => {
      // Without this a failed move left the optimistic UI showing a card where it
      // isn't, until something else happened to refetch.
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Could not move that card.';
      toast.error(msg);
      queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
    },
  });

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = taskMap.get(event.active.id as string);
      if (task) setActiveTask(task);
    },
    [taskMap]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Find which list the active task is in and which list the over target is in
      const activeList = board.lists.find((l) => l.tasks.some((t) => t.id === activeId));
      const overList =
        board.lists.find((l) => l.id === overId) ??
        board.lists.find((l) => l.tasks.some((t) => t.id === overId));

      if (!activeList || !overList || activeList.id === overList.id) return;

      // Optimistically move task between lists in cache
      queryClient.setQueryData(['boards', projectId], (old: Board[] | undefined) => {
        if (!old) return old;
        return old.map((b) => {
          if (b.id !== board.id) return b;
          return {
            ...b,
            lists: b.lists.map((l) => {
              if (l.id === activeList.id) {
                return { ...l, tasks: l.tasks.filter((t) => t.id !== activeId) };
              }
              if (l.id === overList.id) {
                const task = activeList.tasks.find((t) => t.id === activeId);
                if (!task) return l;
                const overIndex = l.tasks.findIndex((t) => t.id === overId);
                const newTasks = [...l.tasks];
                newTasks.splice(overIndex >= 0 ? overIndex : newTasks.length, 0, {
                  ...task,
                  listId: l.id,
                });
                return { ...l, tasks: newTasks };
              }
              return l;
            }),
          };
        });
      });
    },
    [board, projectId, queryClient]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Find the list containing the active task (after any optimistic moves)
      const currentData = queryClient.getQueryData<Board[]>(['boards', projectId]);
      const currentBoard = currentData?.find((b) => b.id === board.id);
      if (!currentBoard) return;

      const targetList = currentBoard.lists.find((l) => l.tasks.some((t) => t.id === activeId));
      if (!targetList) return;

      const currentIndex = targetList.tasks.findIndex((t) => t.id === activeId);
      let newIndex = targetList.tasks.findIndex((t) => t.id === overId);

      // If dropped on a list container (not a task), put at end
      if (newIndex < 0) {
        const isListDrop = currentBoard.lists.some((l) => l.id === overId);
        if (isListDrop) {
          const dropList = currentBoard.lists.find((l) => l.id === overId);
          if (dropList) {
            newIndex = dropList.tasks.length;
            // Move to that list at end
            moveTask.mutate({ taskId: activeId, listId: overId, position: newIndex });
            return;
          }
        }
        return;
      }

      // Reorder within same list or finalize cross-list move
      if (currentIndex !== newIndex || targetList.id !== taskMap.get(activeId)?.listId) {
        // Optimistically reorder in cache
        queryClient.setQueryData(['boards', projectId], (old: Board[] | undefined) => {
          if (!old) return old;
          return old.map((b) => {
            if (b.id !== board.id) return b;
            return {
              ...b,
              lists: b.lists.map((l) => {
                if (l.id !== targetList.id) return l;
                const tasks = [...l.tasks];
                const [moved] = tasks.splice(currentIndex, 1);
                tasks.splice(newIndex, 0, moved);
                return { ...l, tasks };
              }),
            };
          });
        });

        moveTask.mutate({ taskId: activeId, listId: targetList.id, position: newIndex });
      }
    },
    [board, projectId, queryClient, moveTask, taskMap]
  );

  // ─── List CRUD ────────────────────────────────────────────────────────
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
    <div className="min-h-[72vh] rounded-xl bg-[linear-gradient(180deg,rgba(247,239,227,0.92),rgba(240,227,207,0.72))] p-4 md:p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="section-kicker">Project board</p>
          <h3 className="mt-2 text-xl font-semibold text-foreground md:text-2xl">{board.name}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Keep cards moving across a clean delivery flow with quick add actions and task detail on demand.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="pill-muted">{board.lists.length} lists</div>
          <div className="pill-accent">{board.lists.reduce((total, list) => total + list.tasks.length, 0)} cards</div>
          <div className="pill-gold">Live workflow</div>
        </div>
      </div>

      {/* Filters (Pro) */}
      {canFilter ? (
        <div className="soft-card mb-4 rounded-xl p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={fText}
              onChange={(e) => setFText(e.target.value)}
              placeholder="Search cards…"
              className="field-input min-h-0 w-44 py-1.5 text-sm"
            />
            <select value={fAssignee} onChange={(e) => setFAssignee(e.target.value)} className="field-select min-h-0 px-2 py-1.5 text-xs">
              <option value="">Any assignee</option>
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
              ))}
            </select>
            <select value={fPriority} onChange={(e) => setFPriority(e.target.value)} className="field-select min-h-0 px-2 py-1.5 text-xs">
              <option value="">Any priority</option>
              {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {allLabels.length > 0 && (
              <select value={fLabel} onChange={(e) => setFLabel(e.target.value)} className="field-select min-h-0 px-2 py-1.5 text-xs">
                <option value="">Any label</option>
                {allLabels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            )}
            <select value={fDue} onChange={(e) => setFDue(e.target.value)} className="field-select min-h-0 px-2 py-1.5 text-xs">
              <option value="">Any due date</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due today</option>
              <option value="week">Due this week</option>
              <option value="none">No due date</option>
            </select>
            {filtersActive && (
              <>
                <span className="pill-accent text-xs">{matchCount} matching</span>
                <button onClick={clearFilters} className="text-xs font-semibold text-accent hover:underline">
                  Clear
                </button>
              </>
            )}
          </div>
          {filtersActive && (
            <p className="mt-2 text-xs text-muted-foreground">
              Drag is paused while filters are active — clear them to reorder cards.
            </p>
          )}
        </div>
      ) : usage ? (
        <div className="soft-card mb-4 rounded-xl px-4 py-2.5 text-xs text-muted-foreground">
          Advanced board filters — search, assignee, priority, label and due date — are part of the Pro plan.
        </div>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]">
          <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
            {visibleLists.map((list, index) => (
              <KanbanList
                key={list.id}
                list={list}
                projectId={projectId}
                accentClass={LIST_ACCENTS[index % LIST_ACCENTS.length]}
                onTaskClick={setSelectedTaskId}
                members={members}
                readOnly={readOnly}
              />
            ))}
          </SortableContext>

          {!readOnly && (addingList ? (
            <form
              onSubmit={handleAddList}
              className="soft-card flex w-[300px] shrink-0 flex-col gap-3 rounded-xl border-dashed p-4"
            >
              <div>
                <p className="section-kicker">New list</p>
                <p className="mt-1 text-sm text-muted-foreground">Add another stage to the board.</p>
              </div>
              <input
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name…"
                className="field-input"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createList.isPending || !newListName.trim()}
                  className="primary-button flex-1 px-4 py-2 text-sm disabled:opacity-50"
                >
                  {createList.isPending ? 'Adding…' : 'Add list'}
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingList(false); setNewListName(''); }}
                  className="secondary-button px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAddingList(true)}
              className="soft-card flex h-fit min-h-[116px] w-[300px] shrink-0 flex-col items-start justify-center rounded-xl border-2 border-dashed px-5 py-5 text-left transition hover:border-accent/40 hover:bg-card/90"
            >
              <span className="section-kicker">Expand flow</span>
              <span className="mt-2 flex items-center gap-1.5 text-base font-semibold text-foreground"><Plus className="h-4 w-4" /> Add another list</span>
              <span className="mt-1 text-sm leading-6 text-muted-foreground">
                Create a new column for another stage, review lane, or backlog slice.
              </span>
            </button>
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>

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

// ─── Kanban List ──────────────────────────────────────────────────────────────

function KanbanList({
  list,
  projectId,
  accentClass,
  onTaskClick,
  members,
  readOnly = false,
}: {
  list: BoardList;
  projectId: string;
  accentClass: string;
  onTaskClick: (taskId: string) => void;
  members: { user: { id: string; name: string; avatarUrl: string | null }; role: string }[];
  readOnly?: boolean;
}) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const taskIds = useMemo(() => list.tasks.map((t) => t.id), [list.tasks]);

  const { setNodeRef: setDroppableRef } = useDroppable({ id: list.id });

  const createTask = useMutation({
    mutationFn: ({ taskTitle, assigneeIds }: { taskTitle: string; assigneeIds?: string[] }) =>
      api.post(`/lists/${list.id}/tasks`, {
        title: taskTitle,
        position: list.tasks.length,
        priority: 'MEDIUM',
        ...(assigneeIds?.length ? { assigneeIds } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', projectId] });
      setTitle('');
      setSelectedAssignees([]);
      setAdding(false);
    },
  });

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createTask.mutate({ taskTitle: title.trim(), assigneeIds: selectedAssignees.length ? selectedAssignees : undefined });
  }

  function toggleAssignee(userId: string) {
    setSelectedAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  return (
    <SortableContext items={taskIds} strategy={verticalListSortingStrategy} id={list.id}>
      <section
        className={`flex max-h-[calc(100vh-18rem)] w-[300px] shrink-0 flex-col rounded-xl border border-border/85 bg-gradient-to-b ${accentClass} shadow-[0_4px_24px_rgba(23,32,51,0.06)]`}
        data-list-id={list.id}
      >
        <div className="sticky top-0 z-10 rounded-t-xl border-b border-border/70 bg-[rgba(255,250,241,0.86)] px-4 py-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{list.name}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {list.tasks.length === 0 ? 'Empty lane' : `${list.tasks.length} card${list.tasks.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <span className="pill-muted">{list.tasks.length}</span>
          </div>
        </div>

        <div ref={setDroppableRef} className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3" style={{ minHeight: 60 }}>
          {list.tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
          ))}

          {list.tasks.length === 0 && (
            <div className="flex min-h-[60px] items-center justify-center rounded-xl border-2 border-dashed border-border/50 text-xs text-muted-foreground">
              Drop cards here
            </div>
          )}

          {!readOnly && (adding ? (
            <form onSubmit={handleAddTask} className="soft-row mt-1 flex flex-col gap-3 rounded-lg p-3">
              <textarea
                autoFocus
                rows={2}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (title.trim()) createTask.mutate({ taskTitle: title.trim(), assigneeIds: selectedAssignees.length ? selectedAssignees : undefined });
                  }
                }}
                placeholder="Task title…"
                className="field-input resize-none"
              />
              {/* Assignee avatar row */}
              {members.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Assign</p>
                  <div className="flex flex-wrap gap-1.5">
                    {members.map(({ user }) => {
                      const isSelected = selectedAssignees.includes(user.id);
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleAssignee(user.id)}
                          className={`icon-chip flex h-7 w-7 text-[10px] font-semibold transition ${
                            isSelected ? 'ring-2 ring-accent/50' : 'opacity-50 hover:opacity-80'
                          }`}
                          title={user.name}
                        >
                          {user.name.charAt(0)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createTask.isPending || !title.trim()}
                  className="primary-button flex-1 px-4 py-2 text-sm disabled:opacity-50"
                >
                  {createTask.isPending ? 'Adding…' : 'Add task'}
                </button>
                <button
                  type="button"
                  onClick={() => { setAdding(false); setTitle(''); setSelectedAssignees([]); }}
                  className="secondary-button px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="soft-row flex items-center gap-1.5 rounded-lg border-dashed px-4 py-3 text-left text-sm font-semibold text-muted-foreground transition hover:border-accent/40 hover:bg-card/95 hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> Add a card
            </button>
          ))}
        </div>
      </section>
    </SortableContext>
  );
}

// ─── Sortable Task Card ───────────────────────────────────────────────────────

function SortableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCardContent task={task} onClick={onClick} />
    </div>
  );
}

// ─── Drag Overlay (ghost card) ────────────────────────────────────────────────

function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className="w-[276px] rotate-2 opacity-90">
      <TaskCardContent task={task} onClick={() => {}} />
    </div>
  );
}

// ─── Task Card Content (shared between real + overlay) ────────────────────────

function TaskCardContent({ task, onClick }: { task: Task; onClick: () => void }) {
  const assigneeCount = task.assignees?.length ?? 0;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-border/80 bg-[rgba(255,250,241,0.98)] p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/20 hover:shadow-md"
    >
      {task.labels && task.labels.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {task.labels.map((label) => (
            <span key={label} className="pill-accent px-2.5 py-1 text-[10px]">
              {label}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm font-semibold leading-snug text-foreground">{task.title}</p>

      {task.description && (
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{task.description}</p>
      )}

      {task.dueDate && (
        <p className="mt-2 text-xs text-muted-foreground" suppressHydrationWarning>
          Due {dueDateFormatter.format(new Date(task.dueDate))}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>

        {task.estimatedMinutes != null && (
          <span className="pill-muted px-2 py-0.5 text-[10px]">
            ⏱ {task.estimatedMinutes >= 60 ? `${Math.floor(task.estimatedMinutes / 60)}h${task.estimatedMinutes % 60 ? ` ${task.estimatedMinutes % 60}m` : ''}` : `${task.estimatedMinutes}m`}
          </span>
        )}

        {task.assignees && task.assignees.length > 0 && (
          <div className="ml-auto flex -space-x-1.5">
            {task.assignees.slice(0, 3).map(({ user }) => (
              <div
                key={user.id}
                className="icon-chip flex h-6 w-6 text-[10px] font-semibold ring-2 ring-[rgba(255,250,241,0.95)]"
                title={user.name}
              >
                {user.name.charAt(0)}
              </div>
            ))}
            {assigneeCount > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-card text-[10px] font-semibold text-muted-foreground ring-2 ring-[rgba(255,250,241,0.95)]">
                +{assigneeCount - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

