'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Project } from '@/types';

const TABS = [
  { label: 'Dashboard', href: '' },
  { label: 'Board', href: '/board' },
  { label: 'Channels', href: '/channels' },
  { label: 'Files', href: '/files' },
];

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>();
  const pathname = usePathname();

  const { data: project } = useQuery<Project>({
    queryKey: ['project', workspaceSlug, projectId],
    queryFn: () =>
      api
        .get<Project>(`/workspaces/${workspaceSlug}/projects/${projectId}`)
        .then((response) => response.data),
  });

  const base = `/${workspaceSlug}/${projectId}`;

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="glass-card rounded-[2rem] px-5 py-5 md:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Project cockpit
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {project?.name ?? 'Project'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Monitor delivery health, move tasks, manage channels, and keep the client experience intentional.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:w-[360px]">
            <ProjectMetric value="14" label="Open items" />
            <ProjectMetric value="6" label="Members" />
            <ProjectMetric value="92%" label="Momentum" />
          </div>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const href = `${base}${tab.href}`;
            const isActive = tab.href === '' ? pathname === base : pathname.startsWith(href);
            return (
              <Link
                key={tab.label}
                href={href}
                className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'border-accent/20 bg-accent-soft text-accent'
                    : 'border-border/70 bg-white/65 text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function ProjectMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.2rem] border border-border/80 bg-white/65 px-4 py-3 text-center">
      <div className="text-xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
