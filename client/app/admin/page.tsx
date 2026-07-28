'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Users, Building2, CheckSquare, FileText } from 'lucide-react';
import api from '@/lib/api';

type Stats = {
  totals: {
    users: number; workspaces: number; projects: number; messages: number;
    tasks: number; files: number; suspended: number; activeUsers7d: number;
  };
  signupsLast30Days: { day: string; count: number }[];
  recentUsers: { id: string; name: string; email: string; createdAt: string }[];
  recentWorkspaces: { id: string; name: string; slug: string; createdAt: string; _count: { members: number; projects: number } }[];
};

export default function AdminOverviewPage() {
  const { data, isLoading } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  const t = data?.totals;
  const peak = Math.max(1, ...(data?.signupsLast30Days.map((d) => d.count) ?? [1]));
  const totalSignups = data?.signupsLast30Days.reduce((s, d) => s + d.count, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={<Users className="h-4 w-4" />} label="Users" value={t?.users} sub={`${t?.activeUsers7d ?? 0} active this week`} />
        <Kpi icon={<Building2 className="h-4 w-4" />} label="Workspaces" value={t?.workspaces} sub={`${t?.projects ?? 0} projects`} />
        <Kpi icon={<CheckSquare className="h-4 w-4" />} label="Tasks" value={t?.tasks} sub={`${t?.messages ?? 0} messages`} />
        <Kpi icon={<FileText className="h-4 w-4" />} label="Files" value={t?.files} sub={t?.suspended ? `${t.suspended} suspended users` : 'No suspensions'} />
      </div>

      {/* Signups chart — pure CSS bars, no chart dependency */}
      <div className="panel-card rounded-xl p-6">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="section-kicker">Signups — last 30 days</h3>
          <span className="pill-gold">{totalSignups} total</span>
        </div>
        <p className="mb-5 text-xs text-muted-foreground">Peak day: {peak} signup{peak === 1 ? '' : 's'}</p>
        <div className="flex h-32 items-end gap-[3px]">
          {data?.signupsLast30Days.map((d) => (
            <div key={d.day} className="group relative flex-1" title={`${d.day}: ${d.count}`}>
              <div
                className="w-full rounded-t bg-accent/70 transition-all group-hover:bg-accent"
                style={{ height: `${Math.max(2, (d.count / peak) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{data?.signupsLast30Days[0]?.day}</span>
          <span>{data?.signupsLast30Days.at(-1)?.day}</span>
        </div>
      </div>

      {/* Recent activity split */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="soft-card rounded-xl p-5">
          <h3 className="section-kicker mb-4">Newest users</h3>
          <div className="space-y-2">
            {data?.recentUsers.map((u) => (
              <div key={u.id} className="soft-row flex items-center justify-between rounded-lg px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
            {!data?.recentUsers.length && <p className="text-sm text-muted-foreground">No users yet.</p>}
          </div>
        </div>

        <div className="soft-card rounded-xl p-5">
          <h3 className="section-kicker mb-4">Newest workspaces</h3>
          <div className="space-y-2">
            {data?.recentWorkspaces.map((w) => (
              <Link
                key={w.id}
                href={`/admin/workspaces/${w.id}`}
                className="soft-row flex items-center justify-between rounded-lg px-4 py-2.5 transition hover:border-accent/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{w.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {w._count.members} members · {w._count.projects} projects
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(w.createdAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
            {!data?.recentWorkspaces.length && <p className="text-sm text-muted-foreground">No workspaces yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value?: number; sub?: string }) {
  return (
    <div className="stat-tile">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="icon-chip flex h-7 w-7 items-center justify-center">{icon}</span>
        <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value ?? '–'}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
