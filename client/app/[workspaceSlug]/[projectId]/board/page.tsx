'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Board } from '@/types';
import KanbanBoard from '@/components/board/KanbanBoard';

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();

  const { data: boards, isLoading } = useQuery<Board[]>({
    queryKey: ['boards', projectId],
    queryFn: () => api.get<Board[]>(`/projects/${projectId}/boards`).then((response) => response.data),
  });

  const createBoard = useMutation({
    mutationFn: () => api.post(`/projects/${projectId}/boards`, { name: 'Main board' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards', projectId] }),
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading board…</div>;
  }

  const board = boards?.[0];

  if (!board) {
    return (
      <div className="panel-card flex h-full min-h-[460px] flex-col items-center justify-center gap-4 rounded-xl px-6 text-center">
        <div className="eyebrow">Board setup</div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Build your workflow surface</h2>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          Start with a board and organize the delivery flow into lists like backlog, in progress, review, and done.
        </p>
        <button
          onClick={() => createBoard.mutate()}
          disabled={createBoard.isPending}
          className="primary-button px-5 py-2.5 text-sm disabled:opacity-60"
        >
          {createBoard.isPending ? 'Creating…' : 'Create board'}
        </button>
      </div>
    );
  }

  return (
    <div className="panel-card h-full overflow-hidden rounded-xl p-2 md:p-3">
      <KanbanBoard board={board} projectId={projectId} />
    </div>
  );
}
