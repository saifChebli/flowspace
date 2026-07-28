'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import type { WorkspaceDetail, InviteToken } from '@/types';

type AuditItem = {
  id: string;
  title: string;
  meta: string;
  actor: { id: string; name: string } | null;
  project: { id: string; name: string };
  createdAt: string;
};

export default function WorkspaceSettingsPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  // ─── Queries ──────────────────────────────────────────────────────────
  const { data: workspace, isLoading } = useQuery<WorkspaceDetail>({
    queryKey: ['workspace-detail', workspaceSlug],
    queryFn: () => api.get(`/workspaces/${workspaceSlug}`).then((r) => r.data),
  });

  const isAdmin = workspace?.members.some(
    (m) => m.userId === currentUser?.id && m.role === 'ADMIN'
  ) ?? false;

  const { data: pendingInvites } = useQuery<InviteToken[]>({
    queryKey: ['workspace-invites', workspaceSlug],
    queryFn: () => api.get(`/workspaces/${workspaceSlug}/invites`).then((r) => r.data),
    enabled: isAdmin,
  });

  const { data: activity } = useQuery<{ items: AuditItem[] }>({
    queryKey: ['workspace-activity', workspaceSlug],
    queryFn: () => api.get(`/workspaces/${workspaceSlug}/activity`).then((r) => r.data),
    enabled: isAdmin,
  });

  // ─── Edit form state ─────────────────────────────────────────────────
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  function openEdit() {
    setEditName(workspace?.name ?? '');
    setEditDesc(workspace?.description ?? '');
    setEditOpen(true);
    setEditMsg('');
  }

  const saveEdit = useMutation({
    mutationFn: () =>
      api.patch(`/workspaces/${workspaceSlug}`, {
        name: editName.trim() || undefined,
        description: editDesc.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-detail', workspaceSlug] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug] });
      setEditMsg('Saved');
      setTimeout(() => { setEditMsg(''); setEditOpen(false); }, 1500);
    },
    onError: (err: unknown) => {
      setEditMsg(`Error: ${(err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed'}`);
    },
  });

  // ─── Invite ───────────────────────────────────────────────────────────
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [inviteMsg, setInviteMsg] = useState('');

  const sendInvite = useMutation({
    mutationFn: () =>
      api.post(`/workspaces/${workspaceSlug}/invite`, { email: inviteEmail, role: inviteRole }),
    onSuccess: () => {
      setInviteMsg(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['workspace-invites', workspaceSlug] });
      setTimeout(() => setInviteMsg(''), 4000);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to send invite.';
      setInviteMsg(`Error: ${msg}`);
    },
  });

  // ─── Member actions ───────────────────────────────────────────────────
  const removeMember = useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/workspaces/${workspaceSlug}/members/${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-detail', workspaceSlug] });
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      api.patch(`/workspaces/${workspaceSlug}/members/${memberId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-detail', workspaceSlug] });
    },
  });

  // ─── Export ───────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);
  async function exportWorkspace() {
    setExporting(true);
    try {
      const res = await api.get(`/workspaces/${workspaceSlug}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${workspaceSlug}-export.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  // ─── Delete workspace ─────────────────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const deleteWorkspace = useMutation({
    mutationFn: () => api.delete(`/workspaces/${workspaceSlug}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      router.push('/dashboard');
    },
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading settings…</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="glass-card rounded-xl px-6 py-6">
        <p className="section-kicker">Workspace settings</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{workspace?.name}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manage workspace access, keep roles intentional, and make sure the right people are in the right delivery space.
            </p>
          </div>
          <div className="pill-gold">{workspace?.members.length ?? 0} members</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        {/* Invite section */}
        <div className="soft-card rounded-xl p-5">
          <h3 className="section-kicker">Invite a member</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add internal teammates with the right role before you start assigning projects and notifications.
          </p>
          <div className="invite-group">
            <div className="invite-row">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="field-input invite-input"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'MEMBER')}
                className="field-select invite-select"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button
                onClick={() => { if (inviteEmail.trim()) sendInvite.mutate(); }}
                disabled={sendInvite.isPending || !inviteEmail.trim()}
                className="primary-button invite-button px-4 py-2 text-sm disabled:opacity-60"
              >
                {sendInvite.isPending ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </div>
          {inviteMsg && (
            <p className={`mt-3 text-sm ${inviteMsg.startsWith('Error') ? 'text-destructive' : 'text-accent'}`}>
              {inviteMsg}
            </p>
          )}
        </div>

        {/* Workspace profile / edit */}
        <div className="soft-card rounded-xl p-5">
          <div className="flex items-center justify-between">
            <h3 className="section-kicker">Workspace profile</h3>
            {isAdmin && !editOpen && (
              <button onClick={openEdit} className="text-xs font-semibold text-accent hover:underline">
                Edit
              </button>
            )}
          </div>
          {editOpen ? (
            <div className="mt-3 space-y-3">
              <div>
                <label className="form-label">Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="field-input" maxLength={100} />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="field-input resize-none" rows={2} maxLength={300} />
              </div>
              <div className="form-label">Slug</div>
              <div className="pill-muted font-mono text-xs">{workspace?.slug}</div>
              <div className="flex items-center gap-2 pt-1">
                <button onClick={() => saveEdit.mutate()} disabled={saveEdit.isPending} className="primary-button px-4 py-2 text-sm disabled:opacity-60">
                  {saveEdit.isPending ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditOpen(false)} className="secondary-button px-4 py-2 text-sm">Cancel</button>
                {editMsg && <span className={`text-xs ${editMsg.startsWith('Error') ? 'text-destructive' : 'text-accent'}`}>{editMsg}</span>}
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-4 text-sm text-muted-foreground">
              <div>
                <div className="form-label">Slug</div>
                <div className="pill-muted font-mono text-xs">{workspace?.slug}</div>
              </div>
              {workspace?.description && (
                <div>
                  <div className="form-label">Description</div>
                  <p className="leading-6">{workspace.description}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pending invites */}
      {isAdmin && pendingInvites && pendingInvites.length > 0 && (
        <div className="soft-card rounded-xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="section-kicker">Pending invites</h3>
            <div className="pill-muted">{pendingInvites.length}</div>
          </div>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="soft-row flex items-center justify-between rounded-lg px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="pill-muted text-xs">{inv.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="glass-card rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="section-kicker">Members</h3>
          <div className="pill-muted">{workspace?.members.length ?? 0} total</div>
        </div>
        <div className="space-y-3">
          {workspace?.members.map((m) => (
            <div key={m.userId} className="soft-row flex items-center justify-between rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="icon-chip flex h-9 w-9 text-sm font-bold">
                  {m.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{m.user.name}</p>
                  <p className="text-xs text-muted-foreground">{m.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <select
                    value={m.role}
                    onChange={(e) => updateRole.mutate({ memberId: m.userId, role: e.target.value })}
                    className="field-select min-h-0 min-w-0 px-2 py-1 text-xs"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                ) : (
                  <span className={m.role === 'ADMIN' ? 'pill-gold' : 'pill-muted'}>{m.role}</span>
                )}
                {isAdmin && m.userId !== currentUser?.id && (
                  <button
                    onClick={() => toast(`Remove ${m.user.name}?`, { action: { label: 'Remove', onClick: () => removeMember.mutate(m.userId) } })}
                    className="secondary-button min-h-0 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/5"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export workspace data */}
      {isAdmin && (
        <div className="soft-card rounded-xl p-5">
          <h3 className="section-kicker">Export workspace data</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Download a ZIP with every project&apos;s tasks, conversations, and files.
          </p>
          <button
            onClick={exportWorkspace}
            disabled={exporting}
            className="secondary-button mt-3 px-4 py-2 text-sm disabled:opacity-60"
          >
            {exporting ? 'Preparing export…' : 'Download export'}
          </button>
        </div>
      )}

      {/* Activity log (admin audit view) */}
      {isAdmin && activity && activity.items.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="section-kicker mb-4">Activity log</h3>
          <div className="space-y-2">
            {activity.items.map((a) => (
              <div key={a.id} className="soft-row flex items-center justify-between rounded-lg px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.actor?.name ?? 'System'} · {a.project.name}
                    {a.meta ? ` · ${a.meta}` : ''} · {new Date(a.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger zone — delete workspace */}
      {isAdmin && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
          <h3 className="text-sm font-bold text-destructive">Danger zone</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Deleting a workspace removes all projects, channels, tasks, and files permanently. This cannot be undone.
          </p>
          <div className="mt-4 space-y-3">
            <input
              type="text"
              placeholder={`Type "${workspace?.slug}" to confirm`}
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="field-input max-w-xs font-mono text-sm"
            />
            <button
              onClick={() => deleteWorkspace.mutate()}
              disabled={deleteConfirm !== workspace?.slug || deleteWorkspace.isPending}
              className="secondary-button min-h-0 border-destructive/30 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40"
            >
              {deleteWorkspace.isPending ? 'Deleting…' : 'Delete workspace'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
