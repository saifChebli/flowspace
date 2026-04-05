'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, LogOut, Users, FolderKanban, Briefcase } from 'lucide-react';
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
        <header className="mb-8 flex items-center justify-between">
          <div>
            <div className="eyebrow">CollabSpace</div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
          </div>
          <button
            onClick={logout}
            className="secondary-button flex items-center gap-1.5 px-4 py-2 text-sm"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </header>

        {/* Workspaces */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your workspaces</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="primary-button flex items-center gap-1.5 px-4 py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" />
            New workspace
          </button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : workspaces?.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center rounded-2xl py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft">
              <Briefcase className="h-7 w-7 text-accent" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No workspaces yet</h3>
            <p className="mb-5 max-w-sm text-sm text-muted-foreground">
              Create your first workspace to start collaborating with your team.
            </p>
            <button onClick={() => setShowCreate(true)} className="primary-button flex items-center gap-1.5 px-5 py-2.5 text-sm">
              <Plus className="h-4 w-4" />
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
              className="flex min-h-36 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-white/40 text-sm font-medium text-muted-foreground transition-all hover:border-accent/40 hover:bg-white/70 hover:text-accent"
            >
              <Plus className="h-4 w-4" />
              New workspace
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
      className="glass-card group flex flex-col justify-between rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div>
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-sm font-bold text-accent">
          {workspace.name.charAt(0).toUpperCase()}
        </div>
        <h3 className="text-sm font-semibold group-hover:text-accent">{workspace.name}</h3>
        {workspace.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{workspace.description}</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 rounded-md bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          <Users className="h-3 w-3" />
          {workspace._count?.members ?? 0}
        </span>
        <span className="flex items-center gap-1 rounded-md bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          <FolderKanban className="h-3 w-3" />
          {workspace._count?.projects ?? 0}
        </span>
        {memberRole && (
          <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
            {memberRole}
          </span>
        )}
      </div>
    </Link>
  );
}
