'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Hash, Info, Lock, Eye, Users, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';
import MessageFeed from '@/components/channels/MessageFeed';
import MessageInput from '@/components/channels/MessageInput';
import type { Channel, Project, ProjectMember } from '@/types';

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

  const { data: channels } = useQuery<Channel[]>({
    queryKey: ['channels', projectId],
    queryFn: () => api.get(`/projects/${projectId}/channels`).then((r) => r.data),
  });

  const queryClient = useQueryClient();
  const { on } = useSocket();

  const activeChannel = channels?.find((c) => c.id === channelId) ??
    project?.channels?.find((channel) => channel.id === channelId);

  const members = project?.members ?? [];

  const [showInfo, setShowInfo] = useState(false);

  // Auto-mark channel as read on mount + when new messages arrive
  useEffect(() => {
    api.post(`/projects/${projectId}/channels/${channelId}/read`).then(() => {
      queryClient.invalidateQueries({ queryKey: ['channels', projectId] });
    });
  }, [channelId, projectId, queryClient]);

  // Re-mark read when a new message lands while the channel is open
  useEffect(() => {
    const off = on('message:new', () => {
      api.post(`/projects/${projectId}/channels/${channelId}/read`).then(() => {
        queryClient.invalidateQueries({ queryKey: ['channels', projectId] });
      });
    });
    return () => { off?.(); };
  }, [channelId, projectId, queryClient, on]);

  return (
    <div className={`grid h-[calc(100vh-12rem)] gap-3 ${showInfo ? 'xl:grid-cols-[220px_minmax(0,1fr)_240px]' : 'xl:grid-cols-[220px_minmax(0,1fr)]'}`}>
      <aside className="hidden overflow-hidden rounded-xl border border-border/80 bg-[#1e2330] text-white shadow-sm xl:flex xl:flex-col">
        <div className="border-b border-white/8 px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Channels
          </p>
          <h2 className="mt-1.5 truncate text-sm font-semibold text-white">{project?.name ?? 'Project'}</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          <div className="space-y-0.5">
            {(channels ?? project?.channels ?? []).map((channel) => {
              const isActive = channel.id === channelId;
              const unread = (channel as Channel).unreadCount ?? 0;

              return (
                <Link
                  key={channel.id}
                  href={`/${workspaceSlug}/${projectId}/channels/${channel.id}`}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-white/12 text-white'
                      : 'text-white/65 hover:bg-white/6 hover:text-white/90'
                  }`}
                >
                  <Hash className="h-3.5 w-3.5 shrink-0 text-white/40" />
                  <span className="flex-1 truncate text-[13px]">{channel.name}</span>
                  {unread > 0 && !isActive && (
                    <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 border-t border-white/8 pt-3">
            <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
              Members
            </p>
            <div className="space-y-0.5">
              {(project?.members ?? []).slice(0, 8).map((member) => (
                <MemberRailItem key={member.userId} member={member} />
              ))}
            </div>
          </div>
        </div>
      </aside>

      <section className="flex flex-col overflow-hidden rounded-xl border border-border/80 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
              <Hash className="h-3.5 w-3.5 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {activeChannel?.name ?? `channel-${channelId.slice(0, 5)}`}
              </h2>
              {activeChannel?.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {activeChannel.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 md:flex">
              <span className="flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                <Users className="h-3 w-3" />
                {members.length}
              </span>
              <span className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium ${
                activeChannel?.type === 'PRIVATE'
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : activeChannel?.type === 'CLIENT_VISIBLE'
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                    : 'border-accent/20 bg-accent-soft text-accent'
              }`}>
                {activeChannel?.type === 'PRIVATE' ? <Lock className="h-3 w-3" /> : activeChannel?.type === 'CLIENT_VISIBLE' ? <Eye className="h-3 w-3" /> : <Hash className="h-3 w-3" />}
                {activeChannel?.type === 'CLIENT_VISIBLE' ? 'Client' : activeChannel?.type === 'PRIVATE' ? 'Private' : 'Public'}
              </span>
            </div>
            <button
              onClick={() => setShowInfo((v) => !v)}
              className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${showInfo ? 'border-accent/30 bg-accent-soft text-accent' : 'border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
              title={showInfo ? 'Hide info' : 'Show info'}
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <MessageFeed channelId={channelId} />
        <MessageInput channelId={channelId} members={members} />
      </section>

      {showInfo && (
      <aside className="hidden space-y-2 xl:block">
        <div className="rounded-xl border border-border/80 bg-white p-3.5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Channel info
          </p>
          <h3 className="mt-1.5 text-sm font-semibold">{activeChannel?.name ?? 'Channel'}</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {activeChannel?.description ?? 'No description set.'}
          </p>
          <div className="mt-2.5">
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
              activeChannel?.type === 'PRIVATE'
                ? 'bg-amber-50 text-amber-700'
                : activeChannel?.type === 'CLIENT_VISIBLE'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'bg-accent-soft text-accent'
            }`}>
              {activeChannel?.type === 'PRIVATE' ? <Lock className="h-3 w-3" /> : activeChannel?.type === 'CLIENT_VISIBLE' ? <Eye className="h-3 w-3" /> : <Hash className="h-3 w-3" />}
              {activeChannel?.type === 'CLIENT_VISIBLE' ? 'Client visible' : activeChannel?.type === 'PRIVATE' ? 'Private' : 'Public'}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-white p-3.5 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Members ({members.length})
          </p>
          <div className="mt-2.5 space-y-1.5">
            {members.slice(0, 12).map((m) => (
              <div key={m.userId} className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft text-[9px] font-semibold text-accent">
                  {m.user.name.charAt(0)}
                </div>
                <span className="truncate text-xs text-foreground">{m.user.name}</span>
              </div>
            ))}
            {members.length > 12 && (
              <p className="text-[10px] text-muted-foreground">+{members.length - 12} more</p>
            )}
          </div>
        </div>
      </aside>
      )}
    </div>
  );
}

function MemberRailItem({ member }: { member: ProjectMember }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-white/75 transition-colors hover:bg-white/6">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-[10px] font-semibold text-white/80">
        {member.user.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-white/85">{member.user.name}</div>
      </div>
    </div>
  );
}
