'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Hash, FileText, Layers, MessageSquare } from 'lucide-react';
import type { ClientPortalData } from '@/types';

export default function ClientPortalPage() {
  const { projectId } = useParams<{ workspaceSlug: string; projectId: string }>();

  const { data, isLoading } = useQuery<ClientPortalData>({
    queryKey: ['client-portal', projectId],
    queryFn: () =>
      api.get<ClientPortalData>(`/projects/${projectId}/dashboard/client-portal`).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { project, channels, recentMessages, files, lanes, totalTasks } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="panel-card rounded-xl p-6 md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Client portal</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">{project.name}</h2>
        {project.description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {project.description}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Badge icon={<Hash className="h-3.5 w-3.5" />} label={`${channels.length} channels`} />
          <Badge icon={<FileText className="h-3.5 w-3.5" />} label={`${files.length} files`} />
          <Badge icon={<Layers className="h-3.5 w-3.5" />} label={`${totalTasks} tasks across ${lanes.length} lanes`} />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        {/* Channels */}
        <div className="panel-card rounded-xl p-6">
          <h3 className="text-sm font-semibold">Client-visible channels</h3>
          {channels.length > 0 ? (
            <div className="mt-4 space-y-2">
              {channels.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-white/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Hash className="h-4 w-4 text-accent" />
                    <div>
                      <p className="text-sm font-medium">{ch.name}</p>
                      {ch.description && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{ch.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{ch._count.messages} msgs</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No client-visible channels yet.</p>
          )}
        </div>

        {/* Recent messages */}
        <div className="panel-card rounded-xl p-6">
          <h3 className="text-sm font-semibold">Recent messages</h3>
          {recentMessages.length > 0 ? (
            <div className="mt-4 space-y-3">
              {recentMessages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/60">
                    <MessageSquare className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{msg.body}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {msg.author.name} in #{msg.channel.name} · {formatDate(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No messages yet.</p>
          )}
        </div>
      </div>

      {/* Files + Lanes */}
      <div className="grid gap-5 xl:grid-cols-2">
        {/* Files */}
        <div className="panel-card rounded-xl p-6">
          <h3 className="text-sm font-semibold">Shared files</h3>
          {files.length > 0 ? (
            <div className="mt-4 space-y-2">
              {files.map((f) => (
                <a
                  key={f.id}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-white/60 px-3.5 py-2.5 transition-colors hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{f.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        by {f.uploadedBy.name} · {formatDate(f.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{formatBytes(f.sizeBytes)}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No files shared yet.</p>
          )}
        </div>

        {/* Delivery lanes */}
        <div className="panel-card rounded-xl p-6">
          <h3 className="text-sm font-semibold">Delivery progress</h3>
          {lanes.length > 0 ? (
            <div className="mt-4 space-y-3">
              {lanes.map((lane) => (
                <div
                  key={lane.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-white/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Layers className="h-4 w-4 text-accent" />
                    <p className="text-sm font-medium">{lane.name}</p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {lane.taskCount} {lane.taskCount === 1 ? 'task' : 'tasks'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No delivery lanes yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border/80 bg-white/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
      {icon}
      {label}
    </div>
  );
}

// Helpers

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString();
}
