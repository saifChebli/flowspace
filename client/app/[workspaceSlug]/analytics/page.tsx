'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

type TeamReport = {
  range: { days: number };
  totals: {
    created: number;
    completed: number;
    openTasks: number;
    overdueTasks: number;
    completionRate: number;
    avgCycleTimeDays: number | null;
    minutesLogged: number;
  };
  throughput: { day: string; completed: number }[];
  members: { userId: string; name: string; assignedOpen: number; completed: number; minutesLogged: number }[];
  projects: { id: string; name: string; open: number; completed: number; overdue: number }[];
};

export default function AnalyticsPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const [days, setDays] = useState(30);

  const { data, isLoading, error } = useQuery<TeamReport>({
    queryKey: ['analytics', workspaceSlug, days],
    queryFn: () => api.get(`/workspaces/${workspaceSlug}/analytics`, { params: { days } }).then((r) => r.data),
    retry: false,
  });

  async function exportCsv() {
    try {
      const res = await api.get(`/workspaces/${workspaceSlug}/analytics/export`, {
        params: { days },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workspaceSlug}-team-report.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  }

  const denied = (error as { response?: { status?: number; data?: { error?: string } } })?.response?.status === 403;

  if (denied) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="glass-card rounded-xl p-8 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-gold" />
          <h2 className="mt-3 text-xl font-bold">Team analytics</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {(error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
              'Team analytics and reporting are part of the Agency plan.'}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  const t = data.totals;
  const peak = Math.max(1, ...data.throughput.map((d) => d.completed));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-kicker">Team analytics</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Delivery report</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Throughput, cycle time and workload across every project in this workspace.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="field-select min-h-0 px-2 py-1.5 text-xs"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button onClick={exportCsv} className="secondary-button flex items-center gap-1.5 px-3 py-2 text-sm">
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={t.completed} sub={`${t.created} created`} />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Completion rate" value={`${t.completionRate}%`} sub={`${t.openTasks} still open`} />
        <Kpi icon={<Clock className="h-4 w-4" />} label="Avg cycle time" value={t.avgCycleTimeDays !== null ? `${t.avgCycleTimeDays}d` : '–'} sub="created → done" />
        <Kpi icon={<AlertTriangle className="h-4 w-4" />} label="Overdue" value={t.overdueTasks} sub={`${(t.minutesLogged / 60).toFixed(1)}h logged`} />
      </div>

      <div className="panel-card rounded-xl p-6">
        <h3 className="section-kicker mb-4">Tasks completed per day</h3>
        <div className="flex h-32 items-end gap-[3px]">
          {data.throughput.map((d) => (
            <div key={d.day} className="group flex-1" title={`${d.day}: ${d.completed}`}>
              <div
                className="w-full rounded-t bg-accent/70 transition-all group-hover:bg-accent"
                style={{ height: `${Math.max(2, (d.completed / peak) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{data.throughput[0]?.day}</span>
          <span>{data.throughput.at(-1)?.day}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="soft-card rounded-xl p-5">
          <h3 className="section-kicker mb-4">Workload by member</h3>
          <div className="space-y-2">
            {data.members.map((m) => (
              <div key={m.userId} className="soft-row flex items-center justify-between rounded-lg px-4 py-2.5">
                <p className="truncate text-sm font-medium">{m.name}</p>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="pill-muted">{m.assignedOpen} open</span>
                  <span className="pill-accent">{m.completed} done</span>
                  {m.minutesLogged > 0 && <span className="pill-gold">{(m.minutesLogged / 60).toFixed(1)}h</span>}
                </div>
              </div>
            ))}
            {data.members.length === 0 && <p className="text-sm text-muted-foreground">No members yet.</p>}
          </div>
        </div>

        <div className="soft-card rounded-xl p-5">
          <h3 className="section-kicker mb-4">By project</h3>
          <div className="space-y-2">
            {data.projects.map((p) => (
              <div key={p.id} className="soft-row flex items-center justify-between rounded-lg px-4 py-2.5">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="pill-muted">{p.open} open</span>
                  <span className="pill-accent">{p.completed} done</span>
                  {p.overdue > 0 && (
                    <span className="rounded-full bg-destructive/12 px-2 py-0.5 font-medium text-destructive">
                      {p.overdue} overdue
                    </span>
                  )}
                </div>
              </div>
            ))}
            {data.projects.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="stat-tile">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="icon-chip flex h-7 w-7 items-center justify-center">{icon}</span>
        <p className="text-[11px] font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
