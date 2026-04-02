'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Project } from '@/types';

export default function ProjectDashboard() {
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>();

  const { data: project } = useQuery<Project>({
    queryKey: ['project', workspaceSlug, projectId],
    queryFn: () =>
      api
        .get<Project>(`/workspaces/${workspaceSlug}/projects/${projectId}`)
        .then((response) => response.data),
  });

  return (
    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
      <section className="space-y-5">
        <div className="panel-card rounded-[2rem] p-6 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Overview</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">{project?.name} dashboard</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
            A high-signal project snapshot for today’s priorities, collaboration load, and client-facing readiness.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <StatCard label="Open Tasks" value="14" detail="3 blocking review" tone="bg-[#fff6df]" />
            <StatCard label="Members" value="6" detail="2 active now" tone="bg-white" />
            <StatCard label="Files" value="28" detail="4 pending approval" tone="bg-accent-soft" />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="panel-card rounded-[2rem] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Active delivery lanes</h3>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted-foreground">
                Updated live
              </span>
            </div>
            <div className="mt-5 space-y-4">
              <LaneRow title="Launch checklist" owner="Priya" progress="84%" />
              <LaneRow title="Client portal copy" owner="Alex" progress="62%" />
              <LaneRow title="QA and handoff pack" owner="Mina" progress="47%" />
            </div>
          </div>

          <div className="panel-card rounded-[2rem] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Recent movement</h3>
              <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Today</span>
            </div>
            <div className="mt-5 space-y-4">
              <ActivityItem title="Homepage revisions approved" meta="Carlos in #client-updates" />
              <ActivityItem title="Launch assets moved to Ready" meta="Task board transition" />
              <ActivityItem title="Invoice packet uploaded" meta="Files tab" />
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <div className="glass-card rounded-[2rem] p-6">
          <h3 className="text-lg font-semibold">Client view status</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Internal work remains hidden. Client-facing communication is limited to approved channels and file drops.
          </p>
          <div className="mt-5 rounded-[1.4rem] bg-[#1b2639] p-5 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-white/60">Visibility score</p>
            <p className="mt-2 text-4xl font-bold">92%</p>
            <p className="mt-2 text-sm text-white/75">One pending task still needs a client-safe label.</p>
          </div>
        </div>

        <div className="panel-card rounded-[2rem] p-6">
          <h3 className="text-lg font-semibold">Today’s focus</h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-ink-soft">
            <li>Finalize launch timeline for client-visible channel.</li>
            <li>Move design QA cards into review before 4pm.</li>
            <li>Bundle updated deck and invoice in files.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <div className={`rounded-[1.4rem] border border-border/80 p-4 ${tone}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-ink-soft">{detail}</p>
    </div>
  );
}

function LaneRow({ title, owner, progress }: { title: string; owner: string; progress: string }) {
  return (
    <div className="rounded-[1.3rem] border border-border/80 bg-white/70 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">Owner: {owner}</p>
        </div>
        <div className="text-sm font-bold text-accent">{progress}</div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-accent" style={{ width: progress }} />
      </div>
    </div>
  );
}

function ActivityItem({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="border-l-2 border-accent pl-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{meta}</p>
    </div>
  );
}
