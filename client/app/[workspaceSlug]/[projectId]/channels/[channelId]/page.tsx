'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import MessageFeed from '@/components/channels/MessageFeed';
import MessageInput from '@/components/channels/MessageInput';
import type { Project, ProjectMember } from '@/types';

export default function ChannelPage() {
  const { workspaceSlug, projectId, channelId } = useParams<{
    workspaceSlug: string;
    projectId: string;
    channelId: string;
  }>();

  const { data: project } = useQuery<Project>({
    queryKey: ['project', workspaceSlug, projectId, 'channel-detail'],
    queryFn: () =>
      api
        .get<Project>(`/workspaces/${workspaceSlug}/projects/${projectId}`)
        .then((response) => response.data),
  });

  const activeChannel = project?.channels?.find((channel) => channel.id === channelId);

  return (
    <div className="grid min-h-[72vh] gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
      <aside className="overflow-hidden rounded-[1.6rem] border border-border/80 bg-[#20252d] text-white shadow-[0_18px_40px_rgba(23,32,51,0.12)]">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Project channels
          </p>
          <h2 className="mt-2 text-base font-semibold text-white">{project?.name ?? 'Workspace chat'}</h2>
          <p className="mt-2 text-sm leading-6 text-white/62">
            Jump between team lanes without leaving the project workspace.
          </p>
        </div>

        <div className="px-3 py-4">
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Channels
          </div>
          <div className="space-y-1">
            {(project?.channels ?? []).map((channel) => {
              const isActive = channel.id === channelId;

              return (
                <Link
                  key={channel.id}
                  href={`/${workspaceSlug}/${projectId}/channels/${channel.id}`}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    isActive
                      ? 'bg-white/12 text-white'
                      : 'text-white/78 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <span className="font-bold text-white/55">#</span>
                  <span className="truncate">{channel.name}</span>
                </Link>
              );
            })}
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

      <section className="overflow-hidden rounded-[1.8rem] border border-border/80 bg-[#f8f7f4] shadow-[0_18px_40px_rgba(23,32,51,0.08)]">
        <div className="flex items-center justify-between border-b border-border/70 bg-white px-5 py-4 md:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[#334155]">#</span>
              <h2 className="text-base font-semibold text-[#111827]">
                {activeChannel?.name ?? `channel-${channelId.slice(0, 5)}`}
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeChannel?.description ??
                'Internal coordination, approvals, delivery notes, and handoff decisions.'}
            </p>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <div className="rounded-full border border-border bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              18 members
            </div>
            <div className="rounded-full border border-border bg-[#eef2ff] px-3 py-1.5 text-xs font-semibold text-[#4f46e5]">
              Client hidden
            </div>
          </div>
        </div>

        <MessageFeed channelId={channelId} />
        <MessageInput channelId={channelId} />
      </section>

      <aside className="space-y-4">
        <div className="rounded-[1.6rem] border border-border/80 bg-white p-5 shadow-[0_12px_30px_rgba(23,32,51,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Channel purpose
          </p>
          <h3 className="mt-3 text-lg font-semibold">Delivery coordination</h3>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Use this channel for work that should stay visible to the team but outside the client-facing lane.
          </p>
        </div>

        <div className="rounded-[1.6rem] border border-border/80 bg-white p-5 shadow-[0_12px_30px_rgba(23,32,51,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pinned items
          </p>
          <div className="mt-4 space-y-3">
            <SideNote title="Launch checklist">
              Final QA steps and responsibilities before release.
            </SideNote>
            <SideNote title="Client handoff doc">
              Keep the approved materials aligned with board progress.
            </SideNote>
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-border/80 bg-[#182033] p-5 text-white shadow-[0_12px_30px_rgba(23,32,51,0.14)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
            Posting pattern
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-white/78">
            <li>Keep decisions crisp and reference tasks directly.</li>
            <li>Use client-visible channels only for approved updates.</li>
            <li>Attach file drops when status changes affect delivery.</li>
          </ul>
        </div>
      </aside>
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

function SideNote({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.1rem] border border-border/70 bg-[#f8fafc] p-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  );
}
