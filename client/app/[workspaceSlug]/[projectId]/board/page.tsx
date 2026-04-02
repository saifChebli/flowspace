'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Board } from '@/types';
import KanbanBoard from '@/components/board/KanbanBoard';

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const { data: boards, isLoading } = useQuery<Board[]>({
    queryKey: ['boards', projectId],
    queryFn: () => api.get<Board[]>(`/projects/${projectId}/boards`).then((response) => response.data),
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading board…</div>;
  }

  const board = boards?.[0];

  if (!board) {
    return (
      <div className="panel-card flex h-full min-h-[420px] items-center justify-center rounded-[2rem]">
        <p className="text-muted-foreground">No board yet.</p>
      </div>
    );
  }

  return (
    <div className="panel-card h-full overflow-x-auto rounded-[2rem]">
      <KanbanBoard board={board} projectId={projectId} />
    </div>
  );
}
