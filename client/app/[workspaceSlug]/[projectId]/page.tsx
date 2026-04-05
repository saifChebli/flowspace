'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  CheckCircle2,
  Clock,
  FileText,
  Users,
  AlertTriangle,
  Hash,
  MessageSquare,
  ArrowUpRight,
  Layers,
} from 'lucide-react';
import type { DashboardData, ActivityFeed } from '@/types';

export default function ProjectDashboard() {
  const { projectId } = useParams<{ workspaceSlug: string; projectId: string }>();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard', projectId],
    queryFn: () => api.get<DashboardData>(`/projects/${projectId}/dashboard`).then((r) => r.data),
  });

  const { data: feed } = useQuery<ActivityFeed>({
    queryKey: ['dashboard-activity', projectId],
    queryFn: () =>
      api.get<ActivityFeed>(`/projects/${projectId}/dashboard/activity?limit=10`).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-5">
          {[1, 2].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="space-y-5">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, lanes, recentFiles, clientVisibilityScore, project } = data;
  const completionPercent =
    stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
      {/* Main column */}
      <section className="space-y-5">
        {/* Stats overview */}
        <div className="panel-card rounded-xl p-6 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Overview</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">{project.name} dashboard</h2>
          {project.description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {project.description}
            </p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <StatCard
              icon={<Layers className="h-4 w-4 text-accent" />}
              label="Open Tasks"
              value={stats.openTasks}
              detail={`${stats.completedTasks} completed`}
              tone="bg-accent-soft/40"
            />
            <StatCard
              icon={<AlertTriangle className="h-4 w-4 text-orange-600" />}
              label="Overdue"
              value={stats.overdueTasks}
              detail={stats.overdueTasks === 0 ? 'All on track' : 'Need attention'}
              tone="bg-[#fff6df]"
            />
            <StatCard
              icon={<Users className="h-4 w-4 text-blue-600" />}
              label="Members"
              value={stats.members}
              detail={`${stats.channels} channels`}
              tone="bg-white"
            />
            <StatCard
              icon={<FileText className="h-4 w-4 text-purple-600" />}
              label="Files"
              value={stats.files}
              detail={`${recentFiles.length} recent`}
              tone="bg-purple-50"
            />
          </div>
        </div>

        {/* Delivery lanes + priority breakdown */}
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="panel-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Delivery lanes</h3>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-muted-foreground">
                {lanes.length} {lanes.length === 1 ? 'lane' : 'lanes'}
              </span>
            </div>
            {lanes.length > 0 ? (
              <div className="mt-4 space-y-3">
                {lanes.map((lane) => {
                  const pct =
                    lane.totalTasks > 0
                      ? Math.round(((lane.totalTasks - lane.openTasks) / lane.totalTasks) * 100)
                      : 0;
                  return (
                    <LaneRow
                      key={lane.id}
                      title={lane.name}
                      detail={`${lane.openTasks} open of ${lane.totalTasks}`}
                      progress={pct}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No board lanes yet. Create a board to see delivery progress.
              </p>
            )}
          </div>

          <div className="panel-card rounded-xl p-6">
            <h3 className="text-sm font-semibold">Priority breakdown</h3>
            <div className="mt-4 space-y-3">
              <PriorityRow label="Urgent" count={stats.priority.URGENT ?? 0} color="bg-red-500" />
              <PriorityRow label="High" count={stats.priority.HIGH ?? 0} color="bg-orange-400" />
              <PriorityRow label="Medium" count={stats.priority.MEDIUM ?? 0} color="bg-yellow-400" />
              <PriorityRow label="Low" count={stats.priority.LOW ?? 0} color="bg-emerald-400" />
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>Completion</span>
                  <span>{completionPercent}%</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-border/60">
                  <div
                    className="h-1.5 rounded-full bg-accent transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent files */}
        {recentFiles.length > 0 && (
          <div className="panel-card rounded-xl p-6">
            <h3 className="text-sm font-semibold">Recent files</h3>
            <div className="mt-4 space-y-2">
              {recentFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-white/60 px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        by {f.uploadedBy.name} · {formatDate(f.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{formatBytes(f.sizeBytes)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Sidebar */}
      <aside className="space-y-5">
        {clientVisibilityScore !== null && (
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold">Client view status</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Percentage of channels visible to clients.
            </p>
            <div className="mt-4 rounded-xl bg-[#1b2639] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Visibility score</p>
              <p className="mt-2 text-4xl font-bold">{clientVisibilityScore}%</p>
              <p className="mt-2 text-sm text-white/75">
                {clientVisibilityScore === 100
                  ? 'All channels are client-visible.'
                  : clientVisibilityScore === 0
                    ? 'No channels are client-visible yet.'
                    : `${stats.channels} channel${stats.channels !== 1 ? 's' : ''} total.`}
              </p>
            </div>
          </div>
        )}

        {/* Activity feed */}
        <div className="panel-card rounded-xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent activity</h3>
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          {feed && feed.items.length > 0 ? (
            <div className="mt-4 space-y-3">
              {feed.items.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No recent activity yet.</p>
          )}
        </div>
      </aside>
    </div>
  );
}

// Sub-components

function StatCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  detail: string;
  tone: string;
}) {
  return (
    <div className={`rounded-xl border border-border/80 p-4 ${tone}`}>
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function LaneRow({ title, detail, progress }: { title: string; detail: string; progress: number }) {
  return (
    <div className="rounded-lg border border-border/80 bg-white/70 p-3.5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p>
        </div>
        <div className="text-sm font-bold text-accent">{progress}%</div>
      </div>
      <div className="mt-2.5 h-1.5 rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-accent transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function PriorityRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="flex-1 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{count}</span>
    </div>
  );
}

function ActivityRow({
  item,
}: {
  item: {
    id: string;
    kind: string;
    title: string;
    meta: string;
    actor: { id: string; name: string; avatarUrl: string | null } | null;
    createdAt: string;
  };
}) {
  const KindIcon =
    item.kind === 'message' ? MessageSquare : item.kind === 'comment' ? Hash : ArrowUpRight;

  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/60">
        <KindIcon className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.title}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {item.actor?.name ?? 'System'} · {item.meta} · {formatDate(item.createdAt)}
        </p>
      </div>
    </div>
  );
}

// Helpers

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString();
}
