'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

type UserRow = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  suspendedAt: string | null;
  createdAt: string;
  _count: { workspaceMembers: number };
};

export default function AdminUsersPage() {
  const [q, setQ] = useState('');
  const [suspendedOnly, setSuspendedOnly] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ items: UserRow[] }>({
    queryKey: ['admin-users', q, suspendedOnly],
    queryFn: () =>
      api
        .get('/admin/users', { params: { ...(q ? { q } : {}), ...(suspendedOnly ? { suspended: 'true' } : {}) } })
        .then((r) => r.data),
  });

  const toggleSuspend = useMutation({
    mutationFn: (u: UserRow) => api.post(`/admin/users/${u.id}/${u.suspendedAt ? 'unsuspend' : 'suspend'}`),
    onSuccess: (_res, u) => {
      toast.success(u.suspendedAt ? 'User unsuspended' : 'User suspended');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('Action failed'),
  });

  return (
    <div className="panel-card rounded-xl p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="section-kicker">All users</h3>
          <p className="mt-1 text-xs text-muted-foreground">{data?.items.length ?? 0} shown</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSuspendedOnly((v) => !v)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              suspendedOnly
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-border/60 bg-white/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            Suspended only
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or email…"
              className="field-input min-h-0 w-64 py-2 pl-9 text-sm"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-gold border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-2">
          {data?.items.map((u) => (
            <div key={u.id} className="soft-row flex items-center gap-4 rounded-lg px-4 py-3">
              <div className="icon-chip flex h-9 w-9 shrink-0 items-center justify-center text-sm font-bold">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {u.name}
                  {u.suspendedAt && <span className="ml-2 text-xs font-semibold text-destructive">Suspended</span>}
                  {!u.emailVerified && <span className="ml-2 text-xs text-muted-foreground">Unverified</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span className="pill-muted hidden shrink-0 text-xs sm:inline-flex">
                {u._count.workspaceMembers} workspace{u._count.workspaceMembers === 1 ? '' : 's'}
              </span>
              <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground md:block">
                {new Date(u.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => toggleSuspend.mutate(u)}
                disabled={toggleSuspend.isPending}
                className={`secondary-button min-h-0 shrink-0 px-3 py-1.5 text-xs disabled:opacity-50 ${
                  u.suspendedAt ? '' : 'text-destructive hover:bg-destructive/5'
                }`}
              >
                {u.suspendedAt ? 'Unsuspend' : 'Suspend'}
              </button>
            </div>
          ))}
          {data && data.items.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {q ? `No users match “${q}”.` : 'No users found.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
