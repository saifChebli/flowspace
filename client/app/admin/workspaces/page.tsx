'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  storageBytes: number;
  lastActivityAt: string | null;
  _count: { members: number; projects: number };
};

export default function AdminWorkspacesPage() {
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery<{ items: WorkspaceRow[] }>({
    queryKey: ['admin-workspaces', q],
    queryFn: () => api.get('/admin/workspaces', { params: q ? { q } : {} }).then((r) => r.data),
  });

  return (
    <div className="panel-card rounded-xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="section-kicker">All workspaces</h3>
          <p className="mt-1 text-xs text-muted-foreground">{data?.items.length ?? 0} shown</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or slug…"
            className="field-input min-h-0 w-64 py-2 pl-9 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-gold border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-2">
          {data?.items.map((w) => (
            <Link
              key={w.id}
              href={`/admin/workspaces/${w.id}`}
              className="soft-row flex items-center gap-4 rounded-lg px-4 py-3 transition hover:border-accent/40"
            >
              <div className="icon-chip flex h-9 w-9 shrink-0 items-center justify-center text-sm font-bold">
                {w.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{w.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">{w.slug}</p>
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <span className="pill-muted text-xs">{w._count.members} members</span>
                <span className="pill-muted text-xs">{w._count.projects} projects</span>
                <span className="pill-muted text-xs">{formatBytes(w.storageBytes)}</span>
              </div>
              <div className="hidden w-28 shrink-0 text-right text-xs text-muted-foreground md:block">
                {w.lastActivityAt ? `Active ${timeAgo(w.lastActivityAt)}` : 'No activity'}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
          {data && data.items.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {q ? `No workspaces match “${q}”.` : 'No workspaces yet.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
