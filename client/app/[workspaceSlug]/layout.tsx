'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LogOut, Plus, FolderKanban, Archive, Settings, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import NotificationBell from '@/components/ui/NotificationBell';
import type { Workspace, Project } from '@/types';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const queryClient = useQueryClient();

  const { data: workspace } = useQuery<Workspace>({
    queryKey: ['workspace', workspaceSlug],
    queryFn: () => api.get(`/workspaces/${workspaceSlug}`).then((r) => r.data),
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['projects', workspaceSlug],
    queryFn: () => api.get(`/workspaces/${workspaceSlug}/projects`).then((r) => r.data),
  });

  const { data: archivedProjects } = useQuery<Project[]>({
    queryKey: ['archived-projects', workspaceSlug],
    queryFn: () =>
      api.get(`/workspaces/${workspaceSlug}/projects/archived`).then((r) => r.data),
    enabled: showArchived,
  });

  const unarchive = useMutation({
    mutationFn: (projectId: string) =>
      api.post(`/workspaces/${workspaceSlug}/projects/${projectId}/unarchive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceSlug] });
      queryClient.invalidateQueries({ queryKey: ['archived-projects', workspaceSlug] });
    },
  });

  return (
    <div className="app-shell flex h-screen overflow-hidden">
      <aside className="hidden w-[280px] shrink-0 flex-col border-r border-border/80 bg-[#f7f0e3]/90 lg:flex">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Workspaces
          </Link>
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <button
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/60 hover:text-foreground"
              title={`Sign out (${user?.email ?? ''})`}
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Workspace info */}
        <div className="mx-3 rounded-xl border border-border/80 bg-white/65 p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
            Workspace
          </p>
          <h1 className="mt-1.5 text-lg font-bold tracking-tight">
            {workspace?.name ?? workspaceSlug}
          </h1>
        </div>

        {/* Project list */}
        <div className="mx-3 mt-3 flex-1 overflow-hidden rounded-xl border border-border/80 bg-white/55 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Projects
            </p>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent">
                {projects?.length ?? 0}
              </span>
              <button
                onClick={() => setShowCreateProject(true)}
                className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent/80"
                title="New project"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <nav className="space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 380px)' }}>
            {projects?.map((p) => {
              const active = pathname.includes(p.id);
              return (
                <Link
                  key={p.id}
                  href={`/${workspaceSlug}/${p.id}`}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-all ${
                    active
                      ? 'border-accent/25 bg-accent-soft text-accent shadow-sm'
                      : 'border-transparent bg-white/40 hover:border-border/60 hover:bg-white/80'
                  }`}
                >
                  <FolderKanban className={`h-4 w-4 shrink-0 ${active ? 'text-accent' : 'text-muted-foreground'}`} />
                  <span className="truncate text-sm font-medium">{p.name}</span>
                </Link>
              );
            })}
            {projects?.length === 0 && (
              <button
                onClick={() => setShowCreateProject(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 py-4 text-sm font-medium text-muted-foreground transition hover:border-accent/40 hover:text-accent"
              >
                <Plus className="h-4 w-4" />
                New project
              </button>
            )}
          </nav>
        </div>

        {/* Archived toggle */}
        <div className="mx-3 mt-2">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-muted-foreground transition hover:bg-white/50 hover:text-foreground"
          >
            <Archive className="h-3.5 w-3.5" />
            <span className="flex-1 text-left">Archived</span>
            {showArchived ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
          {showArchived && (
            <nav className="mt-1 space-y-1 overflow-y-auto pr-1">
              {archivedProjects?.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-transparent bg-white/40 px-3 py-2"
                >
                  <Link
                    href={`/${workspaceSlug}/${p.id}/settings`}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    {p.name}
                  </Link>
                  <button
                    onClick={() => unarchive.mutate(p.id)}
                    disabled={unarchive.isPending}
                    className="flex items-center gap-1 text-[10px] font-semibold text-accent hover:underline disabled:opacity-50"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </button>
                </div>
              ))}
              {archivedProjects?.length === 0 && (
                <p className="px-2 py-1 text-xs text-muted-foreground">No archived projects.</p>
              )}
            </nav>
          )}
        </div>

        {/* Bottom settings link */}
        <div className="mx-3 mt-auto mb-3">
          <Link
            href={`/${workspaceSlug}/settings`}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-white/50 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/80 hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            Workspace settings
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto min-h-screen max-w-[1400px] px-4 py-4 md:px-6 md:py-5">
          {children}
        </div>
      </main>

      <CreateProjectModal
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        workspaceSlug={workspaceSlug}
      />
    </div>
  );
}

