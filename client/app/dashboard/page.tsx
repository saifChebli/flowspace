'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import CreateWorkspaceModal from '@/components/workspaces/CreateWorkspaceModal';
import type { Workspace } from '@/types';

export default function DashboardPage() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) router.replace('/auth/login');
  }, [isAuthenticated, router]);

  const { data: workspaces, isLoading } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: () => api.get<Workspace[]>('/workspaces').then((r) => r.data),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  return (
    <div className="hero-grid min-h-screen px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-5xl">
        {/* Top nav */}
        <header className="mb-10 flex items-center justify-between">
          <div>
            <div className="eyebrow">CollabSpace</div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
          </div>
          <button
            onClick={logout}
            className="secondary-button px-4 py-2 text-sm"
          >
            Sign out
          </button>
        </header>

        {/* Workspaces */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your workspaces</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="primary-button px-4 py-2.5 text-sm"
          >
            + New workspace
          </button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-[1.4rem] bg-muted" />
            ))}
          </div>
        ) : workspaces?.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center rounded-[2rem] py-20 text-center">
            <div className="mb-4 text-4xl">🏢</div>
            <h3 className="mb-2 text-lg font-semibold">No workspaces yet</h3>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Create your first workspace to start collaborating with your team.
            </p>
            <button onClick={() => setShowCreate(true)} className="primary-button px-5 py-2.5 text-sm">
              Create workspace
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces?.map((ws) => (
              <WorkspaceCard key={ws.id} workspace={ws} />
            ))}
            <button
              onClick={() => setShowCreate(true)}
              className="flex min-h-36 items-center justify-center rounded-[1.4rem] border-2 border-dashed border-border/60 bg-white/40 text-sm font-semibold text-muted-foreground transition hover:border-accent/40 hover:bg-white/70 hover:text-accent"
            >
              + New workspace
            </button>
          </div>
        )}
      </div>

      <CreateWorkspaceModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const memberRole = (workspace as Workspace & { members?: { role: string }[] }).members?.[0]?.role;

  return (
    <Link
      href={`/${workspace.slug}`}
      className="glass-card group flex flex-col justify-between rounded-[1.4rem] p-5 transition hover:-translate-y-0.5"
    >
      <div>
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-lg font-bold text-accent">
          {workspace.name.charAt(0).toUpperCase()}
        </div>
        <h3 className="text-base font-semibold group-hover:text-accent">{workspace.name}</h3>
        {workspace.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{workspace.description}</p>
        )}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          {workspace._count?.members ?? 0} members
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          {workspace._count?.projects ?? 0} projects
        </span>
        {memberRole && (
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
            {memberRole}
          </span>
        )}
      </div>
    </Link>
  );
}
