'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

type WorkspaceDetail = {
  id: string;
  name: string;
  slug: string;
  members: { userId: string; role: string; user: { name: string; email: string } }[];
  projects: { id: string; name: string; archived: boolean; createdAt: string }[];
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
  });

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{data.name}</h2>
        <p className="text-sm text-muted-foreground">{data.slug}</p>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="section-kicker mb-4">Members ({data.members.length})</h3>
        <div className="space-y-2">
          {data.members.map((m) => (
            <div key={m.userId} className="soft-row flex items-center justify-between rounded-lg px-4 py-2.5">
              <div>
                <p className="text-sm font-medium">{m.user.name}</p>
                <p className="text-xs text-muted-foreground">{m.user.email}</p>
              </div>
              <span className="pill-muted text-xs">{m.role}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="section-kicker mb-4">Projects ({data.projects.length})</h3>
        <div className="space-y-2">
          {data.projects.map((p) => (
            <div key={p.id} className="soft-row flex items-center justify-between rounded-lg px-4 py-2.5">
              <p className="text-sm font-medium">{p.name}</p>
              <span className="text-xs text-muted-foreground">
                {p.archived ? 'Archived' : 'Active'} · {new Date(p.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
        <h3 className="text-sm font-bold text-destructive">Danger zone</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Deleting this workspace removes all its projects, channels, tasks, and files permanently.
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
