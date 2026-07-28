'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

type WorkspaceDetail = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  members: { userId: string; role: string; user: { name: string; email: string; suspendedAt: string | null } }[];
  projects: { id: string; name: string; archived: boolean; createdAt: string }[];
  usage: { storageBytes: number; files: number; messages: number; tasks: number };
  activity: { id: string; title: string; meta: string; actor: { name: string } | null; project: { name: string }; createdAt: string }[];
};

export default function AdminWorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [confirmSlug, setConfirmSlug] = useState('');

  const { data } = useQuery<WorkspaceDetail>({
    queryKey: ['admin-workspace', id],
    queryFn: () => api.get(`/admin/workspaces/${id}`).then((r) => r.data),
  });

  const deleteWorkspace = useMutation({
    mutationFn: () => api.delete(`/admin/workspaces/${id}`),
    onSuccess: () => {
      toast.success('Workspace deleted');
      router.push('/admin/workspaces');
    },
    onError: () => toast.error('Delete failed'),
  });

  if (!data) return null;

  return (
    <div className="space-y-6">
      <Link href="/admin/workspaces" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        All workspaces
      </Link>

      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{data.name}</h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{data.slug}</p>
          </div>
          <span className="pill-muted text-xs">Created {new Date(data.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Usage label="Storage" value={formatBytes(data.usage.storageBytes)} sub={`${data.usage.files} files`} />
          <Usage label="Projects" value={String(data.projects.length)} sub={`${data.projects.filter((p) => p.archived).length} archived`} />
          <Usage label="Tasks" value={String(data.usage.tasks)} />
          <Usage label="Messages" value={String(data.usage.messages)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="soft-card rounded-xl p-5">
          <h3 className="section-kicker mb-4">Members ({data.members.length})</h3>
          <div className="space-y-2">
            {data.members.map((m) => (
              <div key={m.userId} className="soft-row flex items-center justify-between rounded-lg px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {m.user.name}
                    {m.user.suspendedAt && <span className="ml-1.5 text-xs font-semibold text-destructive">suspended</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                </div>
                <span className={m.role === 'ADMIN' ? 'pill-gold' : 'pill-muted'}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="soft-card rounded-xl p-5">
          <h3 className="section-kicker mb-4">Projects ({data.projects.length})</h3>
          <div className="space-y-2">
            {data.projects.map((p) => (
              <div key={p.id} className="soft-row flex items-center justify-between rounded-lg px-4 py-2.5">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {p.archived ? 'Archived' : 'Active'}
                </span>
              </div>
            ))}
            {data.projects.length === 0 && <p className="text-sm text-muted-foreground">No projects.</p>}
          </div>
        </div>
      </div>

      {data.activity.length > 0 && (
        <div className="panel-card rounded-xl p-6">
          <h3 className="section-kicker mb-4">Recent activity</h3>
          <div className="space-y-2">
            {data.activity.map((a) => (
              <div key={a.id} className="soft-row rounded-lg px-4 py-2.5">
                <p className="truncate text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  {a.actor?.name ?? 'System'} · {a.project.name} · {new Date(a.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
        <h3 className="text-sm font-bold text-destructive">Danger zone</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Deleting this workspace permanently removes all its projects, channels, tasks, and files.
        </p>
        <div className="mt-4 space-y-3">
          <input
            type="text"
            placeholder={`Type "${data.slug}" to confirm`}
            value={confirmSlug}
            onChange={(e) => setConfirmSlug(e.target.value)}
            className="field-input max-w-xs font-mono text-sm"
          />
          <button
            onClick={() => deleteWorkspace.mutate()}
            disabled={confirmSlug !== data.slug || deleteWorkspace.isPending}
            className="secondary-button min-h-0 border-destructive/30 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40"
          >
            {deleteWorkspace.isPending ? 'Deleting…' : 'Delete workspace'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Usage({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat-tile">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
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
