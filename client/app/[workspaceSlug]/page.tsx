'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Check, Circle } from 'lucide-react';
import api from '@/lib/api';
import type { WorkspaceDetail } from '@/types';

type ProjectRow = { id: string; name: string; _count?: { channels: number } };

export default function WorkspaceHomePage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();

  // Reuse the layout's query keys so these hit the React Query cache (no refetch).
  const { data: workspace } = useQuery<WorkspaceDetail>({
    queryKey: ['workspace', workspaceSlug],
    queryFn: () => api.get(`/workspaces/${workspaceSlug}`).then((r) => r.data),
  });
  const { data: projects } = useQuery<ProjectRow[]>({
    queryKey: ['projects', workspaceSlug],
    queryFn: () => api.get(`/workspaces/${workspaceSlug}/projects`).then((r) => r.data),
  });

  const [dismissed, setDismissed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(`onboarding-dismissed-${workspaceSlug}`) === '1'
  );

  const steps = [
    { label: 'Create your first project', done: (projects?.length ?? 0) > 0 },
    { label: 'Invite your team or a client', done: (workspace?.members?.length ?? 0) > 1 },
    { label: 'Start a channel to chat', done: (projects ?? []).some((p) => (p._count?.channels ?? 0) > 0) },
  ];
  const allDone = steps.every((s) => s.done);

  if (dismissed || allDone) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a project from the sidebar.</p>
      </div>
    );
  }

  const dismiss = () => {
    localStorage.setItem(`onboarding-dismissed-${workspaceSlug}`, '1');
    setDismissed(true);
  };

  return (
    <div className="mx-auto max-w-xl py-16">
      <div className="glass-card rounded-xl p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold">Get started</h2>
          <button onClick={dismiss} className="text-xs text-muted-foreground hover:text-foreground">
            Dismiss
          </button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          A few steps to set up your workspace. Use the sidebar to create a project and invite people.
        </p>
        <ul className="space-y-2">
          {steps.map((s) => (
            <li key={s.label} className="soft-row flex items-center gap-3 rounded-lg px-4 py-3">
              {s.done ? (
                <Check className="h-4 w-4 shrink-0 text-accent" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              )}
              <span className={`text-sm ${s.done ? 'text-muted-foreground line-through' : 'font-medium'}`}>
                {s.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
