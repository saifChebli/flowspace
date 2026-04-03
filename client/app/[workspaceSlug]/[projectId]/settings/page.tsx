'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface ProjectMember {
  userId: string;
  role: 'MEMBER' | 'CLIENT';
  user: { id: string; name: string; email: string; avatarUrl: string | null };
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  members: ProjectMember[];
}

export default function ProjectSettingsPage() {
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'CLIENT'>('MEMBER');
  const [inviteMsg, setInviteMsg] = useState('');

  const { data: project, isLoading } = useQuery<ProjectDetail>({
    queryKey: ['project-settings', workspaceSlug, projectId],
    queryFn: () =>
      api.get(`/workspaces/${workspaceSlug}/projects/${projectId}`).then((r) => r.data),
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

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading settings…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h2 className="text-xl font-bold">Project settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">{project?.name}</p>
      </div>

      {/* Invite member */}
      <div className="glass-card rounded-[1.6rem] p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Invite a member
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@example.com"
            className="field-input flex-1"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'CLIENT')}
            className="field-input w-32"
          >
            <option value="MEMBER">Team member</option>
            <option value="CLIENT">Client</option>
          </select>
          <button
            onClick={() => { if (inviteEmail.trim()) sendInvite.mutate(); }}
            disabled={sendInvite.isPending || !inviteEmail.trim()}
            className="primary-button px-5 py-2.5 text-sm disabled:opacity-60"
          >
            {sendInvite.isPending ? 'Sending…' : 'Send invite'}
          </button>
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

      {/* Members list */}
      <div className="glass-card rounded-[1.6rem] p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Members ({project?.members.length ?? 0})
        </h3>
        <div className="space-y-3">
          {project?.members.map((m) => (
            <div
              key={m.userId}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-white/60 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                  {m.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{m.user.name}</p>
                  <p className="text-xs text-muted-foreground">{m.user.email}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  m.role === 'CLIENT'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {m.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
