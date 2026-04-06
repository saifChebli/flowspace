'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Copy, Link2, RefreshCw, Trash2 } from 'lucide-react';
import type { InviteToken, WorkspaceDetail } from '@/types';

interface ProjectMember {
  userId: string;
  role: 'MEMBER' | 'CLIENT';
  user: { id: string; name: string; email: string; avatarUrl: string | null };
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  archived: boolean;
  members: ProjectMember[];
}

export default function ProjectSettingsPage() {
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'CLIENT'>('MEMBER');
  const [inviteMsg, setInviteMsg] = useState('');

  const { data: project, isLoading } = useQuery<ProjectDetail>({
    queryKey: ['project-settings', workspaceSlug, projectId],
    queryFn: () =>
      api.get(`/workspaces/${workspaceSlug}/projects/${projectId}`).then((r) => r.data),
  });

  const { data: workspace } = useQuery<WorkspaceDetail>({
    queryKey: ['workspace-detail', workspaceSlug],
    queryFn: () => api.get(`/workspaces/${workspaceSlug}`).then((r) => r.data),
  });

  const isWsAdmin =
    workspace?.members.some((m) => m.userId === currentUser?.id && m.role === 'ADMIN') ?? false;
  const isProjectMember =
    project?.members.some((m) => m.userId === currentUser?.id && m.role === 'MEMBER') ?? false;
  const canManage = isWsAdmin || isProjectMember;

  const { data: pendingInvites } = useQuery<InviteToken[]>({
    queryKey: ['project-invites', workspaceSlug, projectId],
    queryFn: () =>
      api.get(`/workspaces/${workspaceSlug}/projects/${projectId}/invites`).then((r) => r.data),
    enabled: canManage,
  });

  // ─── Edit form ────────────────────────────────────────────────────────
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  function openEdit() {
    setEditName(project?.name ?? '');
    setEditDesc(project?.description ?? '');
    setEditOpen(true);
    setEditMsg('');
  }

  const invalidateProject = () => {
    queryClient.invalidateQueries({ queryKey: ['project-settings', workspaceSlug, projectId] });
    queryClient.invalidateQueries({ queryKey: ['projects', workspaceSlug] });
  };

  const saveEdit = useMutation({
    mutationFn: () =>
      api.patch(`/workspaces/${workspaceSlug}/projects/${projectId}`, {
        name: editName.trim() || undefined,
        description: editDesc.trim() || undefined,
      }),
    onSuccess: () => {
      invalidateProject();
      setEditMsg('Saved');
      setTimeout(() => {
        setEditMsg('');
        setEditOpen(false);
      }, 1500);
    },
    onError: (err: unknown) => {
      setEditMsg(
        `Error: ${(err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed'}`
      );
    },
  });

  const sendInvite = useMutation({
    mutationFn: () =>
      api.post(`/workspaces/${workspaceSlug}/projects/${projectId}/invite`, {
        email: inviteEmail,
        role: inviteRole,
      }),
    onSuccess: () => {
      setInviteMsg(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      setTimeout(() => setInviteMsg(''), 4000);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to send invite.';
      setInviteMsg(`Error: ${msg}`);
    },
  });

  // ─── Member actions ───────────────────────────────────────────────────
  const removeMember = useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/workspaces/${workspaceSlug}/projects/${projectId}/members/${memberId}`),
    onSuccess: invalidateProject,
  });

  const updateRole = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      api.patch(`/workspaces/${workspaceSlug}/projects/${projectId}/members/${memberId}`, { role }),
    onSuccess: invalidateProject,
  });

  // ─── Archive / Unarchive ──────────────────────────────────────────────
  const archiveProject = useMutation({
    mutationFn: () =>
      api.post(`/workspaces/${workspaceSlug}/projects/${projectId}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceSlug] });
      router.push(`/${workspaceSlug}`);
    },
  });

  const unarchiveProject = useMutation({
    mutationFn: () =>
      api.post(`/workspaces/${workspaceSlug}/projects/${projectId}/unarchive`),
    onSuccess: () => {
      invalidateProject();
      queryClient.invalidateQueries({ queryKey: ['projects', workspaceSlug] });
      queryClient.invalidateQueries({ queryKey: ['archived-projects', workspaceSlug] });
    },
  });

  // ─── Portal token ────────────────────────────────────────────────────
  const { data: portalData, refetch: refetchPortal } = useQuery<{ portalToken: string; projectId: string }>({
    queryKey: ['portal-token', projectId],
    queryFn: () => api.post('/portal/token/generate', { projectId }).then((r) => r.data),
    enabled: false, // only fetch on demand
  });

  const [portalToken, setPortalToken] = useState<string | null>(null);

  const generatePortal = useMutation({
    mutationFn: () => api.post('/portal/token/generate', { projectId }),
    onSuccess: ({ data }) => {
      setPortalToken(data.portalToken);
      toast.success('Portal token generated');
    },
    onError: () => toast.error('Failed to generate portal token'),
  });

  const revokePortal = useMutation({
    mutationFn: () => api.delete('/portal/token/revoke', { data: { projectId } }),
    onSuccess: () => {
      setPortalToken(null);
      toast.success('Portal token revoked — all client sessions invalidated');
    },
    onError: () => toast.error('Failed to revoke portal token'),
  });

  function copyPortalLink() {
    if (!portalToken) return;
    const url = `${window.location.origin}/portal/${portalToken}`;
    navigator.clipboard.writeText(url);
    toast.success('Portal link copied!');
  }

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading settings…</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="glass-card rounded-xl px-6 py-6">
        <p className="section-kicker">Project settings</p>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{project?.name}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Control who can collaborate in this project and decide which participants are internal contributors or clients.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {project?.archived && <span className="pill-muted text-xs">Archived</span>}
            <div className="pill-accent">{project?.members.length ?? 0} participants</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="soft-card rounded-xl p-5">
          <h3 className="section-kicker">Invite a member</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Add teammates or clients with role-specific access that matches the project’s communication model.
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
                onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'CLIENT')}
                className="field-select invite-select"
              >
                <option value="MEMBER">Team member</option>
                <option value="CLIENT">Client</option>
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
            <p
              className={`mt-3 text-sm ${inviteMsg.startsWith('Error') ? 'text-destructive' : 'text-accent'}`}
            >
              {inviteMsg}
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Clients can only see channels marked as &quot;Client visible&quot;.
          </p>
        </div>

        <div className="soft-card rounded-xl p-5">
          {editOpen ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="section-kicker">Edit project</h3>
              </div>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="form-label">Name</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="field-input"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="field-input resize-none"
                    rows={2}
                    maxLength={500}
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => saveEdit.mutate()}
                    disabled={saveEdit.isPending}
                    className="primary-button px-4 py-2 text-sm disabled:opacity-60"
                  >
                    {saveEdit.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditOpen(false)}
                    className="secondary-button px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                  {editMsg && (
                    <span
                      className={`text-xs ${editMsg.startsWith('Error') ? 'text-destructive' : 'text-accent'}`}
                    >
                      {editMsg}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="section-kicker">Access model</h3>
                {canManage && (
                  <button
                    onClick={openEdit}
                    className="text-xs font-semibold text-accent hover:underline"
                  >
                    Edit project
                  </button>
                )}
              </div>
              <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                <div className="soft-row rounded-lg px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                    Member
                  </div>
                  <p className="mt-1 leading-6">
                    Full collaboration access for boards, files, and internal coordination.
                  </p>
                </div>
                <div className="soft-row rounded-lg px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    Client
                  </div>
                  <p className="mt-1 leading-6">
                    Limited to client-visible channels and shared project context.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pending invites */}
      {canManage && pendingInvites && pendingInvites.length > 0 && (
        <div className="soft-card rounded-xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="section-kicker">Pending invites</h3>
            <div className="pill-muted">{pendingInvites.length}</div>
          </div>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="soft-row flex items-center justify-between rounded-lg px-4 py-2.5"
              >
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

      <div className="glass-card rounded-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="section-kicker">Members</h3>
          <div className="pill-muted">{project?.members.length ?? 0} total</div>
        </div>
        <div className="space-y-3">
          {project?.members.map((m) => (
            <div
              key={m.userId}
              className="soft-row flex items-center justify-between rounded-lg px-4 py-3"
            >
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
                {canManage ? (
                  <select
                    value={m.role}
                    onChange={(e) =>
                      updateRole.mutate({ memberId: m.userId, role: e.target.value })
                    }
                    className="field-select min-h-0 min-w-0 px-2 py-1 text-xs"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="CLIENT">Client</option>
                  </select>
                ) : (
                  <span className={m.role === 'CLIENT' ? 'pill-gold' : 'pill-muted'}>
                    {m.role}
                  </span>
                )}
                {canManage && m.userId !== currentUser?.id && (
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

      {/* Client portal token */}
      {canManage && (
        <div className="glass-card rounded-xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="section-kicker">Client portal</h3>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mb-4 text-sm leading-6 text-muted-foreground">
            Generate a persistent portal link clients can bookmark. They authenticate via magic-link email — no password needed. Revoking invalidates all active sessions.
          </p>

          {portalToken ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
                <code className="flex-1 truncate text-xs text-foreground">
                  {window.location.origin}/portal/{portalToken}
                </code>
                <button
                  onClick={copyPortalLink}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                  title="Copy link"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyPortalLink}
                  className="primary-button flex items-center gap-1.5 px-4 py-2 text-sm"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy link
                </button>
                <button
                  onClick={() => toast('Revoke this portal token? All active client sessions will be invalidated.', { action: { label: 'Revoke', onClick: () => revokePortal.mutate() } })}
                  disabled={revokePortal.isPending}
                  className="secondary-button flex items-center gap-1.5 border-destructive/30 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {revokePortal.isPending ? 'Revoking…' : 'Revoke token'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => generatePortal.mutate()}
              disabled={generatePortal.isPending}
              className="primary-button flex items-center gap-1.5 px-4 py-2.5 text-sm disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${generatePortal.isPending ? 'animate-spin' : ''}`} />
              {generatePortal.isPending ? 'Generating…' : 'Generate portal link'}
            </button>
          )}
        </div>
      )}

      {/* Danger zone — archive / unarchive */}
      {isWsAdmin && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
          <h3 className="text-sm font-bold text-destructive">Danger zone</h3>
          {project?.archived ? (
            <>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This project is archived. Unarchiving will restore it to the active projects list.
              </p>
              <button
                onClick={() => unarchiveProject.mutate()}
                disabled={unarchiveProject.isPending}
                className="primary-button mt-4 px-4 py-2 text-sm disabled:opacity-60"
              >
                {unarchiveProject.isPending ? 'Restoring…' : 'Unarchive project'}
              </button>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Archiving hides the project from the sidebar and active lists. It can be restored
                later.
              </p>
              <button
                onClick={() => toast('Archive this project? It will be hidden from the sidebar.', { action: { label: 'Archive', onClick: () => archiveProject.mutate() } })}
                disabled={archiveProject.isPending}
                className="secondary-button mt-4 min-h-0 border-destructive/30 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-40"
              >
                {archiveProject.isPending ? 'Archiving…' : 'Archive project'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
