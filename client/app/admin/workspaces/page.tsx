'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count: { members: number; projects: number };
};

export default function AdminWorkspacesPage() {
  const { data } = useQuery<{ items: WorkspaceRow[] }>({
    queryKey: ['admin-workspaces'],
    queryFn: () => api.get('/admin/workspaces').then((r) => r.data),
  });

  return (
    <div className="glass-card rounded-xl p-5">
      <h3 className="section-kicker mb-4">All workspaces</h3>
      <div className="space-y-2">
        {data?.items.map((w) => (
          <Link
            key={w.id}
            href={`/admin/workspaces/${w.id}`}
            className="soft-row flex items-center justify-between rounded-lg px-4 py-3 hover:bg-white/60"
          >
            <div>
              <p className="text-sm font-semibold">{w.name}</p>
              <p className="text-xs text-muted-foreground">
                {w.slug} · {w._count.members} members · {w._count.projects} projects
              </p>
            </div>
            <span className="text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</span>
          </Link>
        ))}
        {data && data.items.length === 0 && <p className="text-sm text-muted-foreground">No workspaces yet.</p>}
      </div>
    </div>
  );
}
