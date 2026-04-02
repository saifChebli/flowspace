'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Workspace, Project } from '@/types';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const pathname = usePathname();

  const { data: workspace } = useQuery<Workspace>({
    queryKey: ['workspace', workspaceSlug],
    queryFn: () => api.get(`/workspaces/${workspaceSlug}`).then((r) => r.data),
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['projects', workspaceSlug],
    queryFn: () => api.get(`/workspaces/${workspaceSlug}/projects`).then((r) => r.data),
  });

  return (
    <div className="app-shell flex min-h-screen overflow-hidden">
      <aside className="hidden w-[310px] shrink-0 border-r border-border/80 bg-[#f7f0e3]/90 px-5 py-5 lg:flex lg:flex-col">
        <div className="rounded-[1.8rem] border border-border/80 bg-white/65 p-5 shadow-[var(--shadow)]">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Workspace
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">
            {workspace?.name ?? workspaceSlug}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Unified delivery surface for team collaboration and client visibility.
          </p>
        </div>

        <div className="mt-6 rounded-[1.8rem] border border-border/80 bg-white/55 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Active projects
            </p>
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent">
              {projects?.length ?? 0}
            </span>
          </div>

          <nav className="space-y-2 overflow-y-auto pr-1">
            {projects?.map((p, index) => {
              const active = pathname.includes(p.id);
              return (
                <Link
                  key={p.id}
                  href={`/${workspaceSlug}/${p.id}`}
                  className={`block rounded-[1.2rem] border px-4 py-3 transition-all ${
                    active
                      ? 'border-accent/25 bg-accent-soft shadow-sm'
                      : 'border-transparent bg-white/55 hover:border-border hover:bg-white/85'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{p.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Project {String(index + 1).padStart(2, '0')}
                      </p>
                    </div>
                    <div className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      Live
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto rounded-[1.8rem] border border-border/80 bg-[linear-gradient(180deg,#1c2a3f,#152033)] p-5 text-white shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Control panel</p>
          <p className="mt-3 text-lg font-semibold">Keep the client-facing lane clean.</p>
          <p className="mt-2 text-sm leading-6 text-white/75">
            Review tasks, move updates into visible channels, and keep approvals attached to files.
          </p>
          <Link
            href={`/${workspaceSlug}/settings`}
            className="mt-5 inline-flex rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Open settings
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto min-h-screen max-w-[1400px] px-4 py-4 md:px-6 md:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
