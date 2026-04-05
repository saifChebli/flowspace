'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Hash, Plus, Lock, Eye, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import CreateChannelModal from '@/components/channels/CreateChannelModal';
import type { Channel, Project, ProjectMember } from '@/types';

export default function ChannelsPage() {
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>();
  const [showCreate, setShowCreate] = useState(false);

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
    <div className="grid min-h-[72vh] gap-3 xl:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden overflow-hidden rounded-xl border border-border/80 bg-[#1e2330] text-white shadow-sm xl:flex xl:flex-col">
        <div className="border-b border-white/8 px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Channels
          </p>
          <h2 className="mt-1.5 truncate text-sm font-semibold text-white">{project?.name ?? 'Project'}</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          <div className="space-y-0.5">
            {channels?.map((channel) => (
              <Link
                key={channel.id}
                href={`/${workspaceSlug}/${projectId}/channels/${channel.id}`}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-white/65 transition-colors hover:bg-white/6 hover:text-white/90"
              >
                <Hash className="h-3.5 w-3.5 shrink-0 text-white/40" />
                <span className="flex-1 truncate text-[13px]">{channel.name}</span>
                {(channel.unreadCount ?? 0) > 0 && (
                  <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">
                    {channel.unreadCount}
                  </span>
                )}
              </Link>
            ))}
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

      <div className="panel-card rounded-xl p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Channels
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Organize internal discussion and client-visible updates.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
              {channels?.length ?? 0} channels
            </span>
            <button
              onClick={() => setShowCreate(true)}
              className="primary-button flex items-center gap-1.5 px-3.5 py-2 text-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              New channel
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-2">
          {channels?.map((c) => (
            <Link
              key={c.id}
              href={`/${workspaceSlug}/${projectId}/channels/${c.id}`}
              className="group flex items-center justify-between rounded-xl border border-border/70 bg-white/75 px-4 py-3.5 transition-all hover:border-accent/20 hover:bg-white hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  c.type === 'PRIVATE' ? 'bg-amber-50' : c.type === 'CLIENT_VISIBLE' ? 'bg-indigo-50' : 'bg-accent-soft'
                }`}>
                  {c.type === 'PRIVATE' ? <Lock className="h-4 w-4 text-amber-600" /> : c.type === 'CLIENT_VISIBLE' ? <Eye className="h-4 w-4 text-indigo-500" /> : <Hash className="h-4 w-4 text-accent" />}
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">{c.name}</span>
                  {c.description && (
                    <p className="mt-0.5 max-w-xl text-xs text-muted-foreground line-clamp-1">
                      {c.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(c.unreadCount ?? 0) > 0 ? (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">
                    {c.unreadCount}
                  </span>
                ) : (
                  <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {c.type === 'PRIVATE' ? 'Private' : c.type === 'CLIENT_VISIBLE' ? 'Client' : 'Public'}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-accent" />
              </div>
            </Link>
          ))}
          {channels?.length === 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 py-10 text-sm font-medium text-muted-foreground transition hover:border-accent/40 hover:text-accent"
            >
              <Plus className="h-4 w-4" />
              Create your first channel
            </button>
          )}
        </div>
      </div>

      <CreateChannelModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        projectId={projectId}
      />
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
