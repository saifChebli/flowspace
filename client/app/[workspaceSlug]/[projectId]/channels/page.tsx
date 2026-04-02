'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import type { Channel, Project, ProjectMember } from '@/types';

export default function ChannelsPage() {
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>();

  const { data: channels, isLoading } = useQuery<Channel[]>({
    queryKey: ['channels', projectId],
    queryFn: () => api.get(`/projects/${projectId}/channels`).then((r) => r.data),
  });

  const { data: project } = useQuery<Project>({
    queryKey: ['project', workspaceSlug, projectId, 'channels-shell'],
    queryFn: () =>
      api
        .get<Project>(`/workspaces/${workspaceSlug}/projects/${projectId}`)
        .then((response) => response.data),
  });

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading channels…</div>;

  return (
    <div className="grid min-h-[72vh] gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-[1.6rem] border border-border/80 bg-[#20252d] text-white shadow-[0_18px_40px_rgba(23,32,51,0.12)]">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Project channels
          </p>
          <h2 className="mt-2 text-base font-semibold text-white">{project?.name ?? 'Workspace chat'}</h2>
          <p className="mt-2 text-sm leading-6 text-white/62">
            Fast coordination for delivery, approvals, and internal handoff.
          </p>
        </div>

        <div className="px-3 py-4">
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Channels
          </div>
          <div className="space-y-1">
            {channels?.map((channel) => (
              <Link
                key={channel.id}
                href={`/${workspaceSlug}/${projectId}/channels/${channel.id}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/78 transition hover:bg-white/8 hover:text-white"
              >
                <span className="font-bold text-white/55">#</span>
                <span className="truncate">{channel.name}</span>
              </Link>
            ))}
          </div>

          <div className="mt-6 px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Members
          </div>
          <div className="space-y-1.5">
            {(project?.members ?? []).slice(0, 8).map((member) => (
              <MemberRailItem key={member.userId} member={member} />
            ))}
          </div>
        </div>
      </aside>

      <div className="panel-card rounded-4xl p-6 md:p-7">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Channels</p>
            <h2 className="mt-2 text-[1.125rem] font-bold tracking-tight text-foreground md:text-[1.375rem]">
              Conversation architecture
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Organize internal discussion and client-visible updates without mixing approval threads with execution noise.
            </p>
          </div>
          <div className="rounded-full bg-accent-soft px-4 py-2 text-sm font-semibold text-accent">
            {channels?.length ?? 0} active channels
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {channels?.map((c) => (
            <Link
              key={c.id}
              href={`/${workspaceSlug}/${projectId}/channels/${c.id}`}
              className="group flex items-center justify-between rounded-[1.4rem] border border-border/80 bg-white/75 px-5 py-4 transition hover:-translate-y-0.5 hover:border-accent/20 hover:bg-white"
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-sm font-bold text-accent">
                  #
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">{c.name}</span>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    {c.type.replace('_', ' ')}
                  </p>
                  {c.description && (
                    <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                      {c.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                  Open
                </span>
                <p className="mt-2 text-xs text-muted-foreground group-hover:text-accent">
                  Enter channel
                </p>
              </div>
            </Link>
          ))}
          {channels?.length === 0 && (
            <p className="text-sm text-muted-foreground">No channels yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberRailItem({ member }: { member: ProjectMember }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/6">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 text-xs font-semibold text-white">
        {member.user.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-white">{member.user.name}</div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">{member.role}</div>
      </div>
    </div>
  );
}
