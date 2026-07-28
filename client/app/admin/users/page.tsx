'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const { data } = useQuery<{ items: UserRow[] }>({
    queryKey: ['admin-users', q],
    queryFn: () => api.get('/admin/users', { params: q ? { q } : {} }).then((r) => r.data),
  });

  const toggleSuspend = useMutation({
    mutationFn: (u: UserRow) =>
      api.post(`/admin/users/${u.id}/${u.suspendedAt ? 'unsuspend' : 'suspend'}`),
    onSuccess: () => {
      toast.success('Updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-kicker">All users</h3>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email…"
          className="field-input max-w-xs text-sm"
        />
      </div>
      <div className="space-y-2">
        {data?.items.map((u) => (
          <div key={u.id} className="soft-row flex items-center justify-between rounded-lg px-4 py-2.5">
            <div>
              <p className="text-sm font-medium">{u.name}</p>
              <p className="text-xs text-muted-foreground">
                {u.email} · {u._count.workspaceMembers} workspace{u._count.workspaceMembers === 1 ? '' : 's'}
                {u.suspendedAt && <span className="ml-1 font-semibold text-destructive">· Suspended</span>}
              </p>
            </div>
            <button
              onClick={() => toggleSuspend.mutate(u)}
              disabled={toggleSuspend.isPending}
              className={`secondary-button min-h-0 px-3 py-1.5 text-xs disabled:opacity-50 ${
                u.suspendedAt ? '' : 'text-destructive hover:bg-destructive/5'
              }`}
            >
              {u.suspendedAt ? 'Unsuspend' : 'Suspend'}
            </button>
          </div>
        ))}
        {data && data.items.length === 0 && <p className="text-sm text-muted-foreground">No users found.</p>}
      </div>
    </div>
  );
}
