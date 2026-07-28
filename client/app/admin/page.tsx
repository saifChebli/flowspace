'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

type Stats = {
  totals: { users: number; workspaces: number; projects: number };
  signupsLast30Days: { day: string; count: number }[];
};

export default function AdminOverviewPage() {
  const { data } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Users" value={data?.totals.users} />
        <StatCard label="Workspaces" value={data?.totals.workspaces} />
        <StatCard label="Projects" value={data?.totals.projects} />
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="section-kicker mb-4">Signups — last 30 days</h3>
        {data && data.signupsLast30Days.length > 0 ? (
          <div className="space-y-1.5">
            {data.signupsLast30Days.map((row) => (
              <div key={row.day} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.day}</span>
                <span className="font-medium">{row.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No signups in the last 30 days.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value?: number }) {
  return (
    <div className="glass-card rounded-xl p-5 text-center">
      <p className="text-3xl font-bold">{value ?? '–'}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
