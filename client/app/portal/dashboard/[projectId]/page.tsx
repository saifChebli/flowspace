'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { usePortalStore } from '@/stores/portalStore';
import portalApi from '@/lib/portalApi';
import {
  MessageSquare,
  FileText,
  ClipboardList,
  Download,
  Clock,
  LogOut,
  KeyRound,
  X,
} from 'lucide-react';
import type { ClientPortalData, User } from '@/types';

export default function PortalProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { session, isAuthenticated, logout } = usePortalStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/');
  }, [isAuthenticated, router]);

  const { data, isLoading } = useQuery<ClientPortalData>({
    queryKey: ['portal', 'dashboard', projectId],
    queryFn: () =>
      portalApi
        .get(`/projects/${projectId}/dashboard/client-portal`)
        .then((r) => r.data),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  const branding = data?.branding;

  return (
    <div
      className="hero-grid min-h-screen px-6 py-8 md:px-10 md:py-10"
      style={branding?.accentColor ? ({ ['--gold' as string]: branding.accentColor }) : undefined}
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            {branding?.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={branding.logoUrl} alt={branding.name ?? ''} className="mb-3 h-8 w-auto object-contain" />
            ) : null}
            <div className="eyebrow">{branding?.name ?? 'Client Portal'}</div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              {data?.project.name ?? 'Project'}
            </h1>
            {data?.project.description && (
              <p className="mt-1 text-sm text-muted-foreground">{data.project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{session?.email}</span>
            <button
              onClick={() => { logout(); router.replace('/'); }}
              className="secondary-button flex items-center gap-1.5 px-3 py-2 text-sm"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          </div>
        ) : data ? (
          <div className="space-y-8">
            {/* Optional password upgrade */}
            <SetPasswordCard email={session?.email} />

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard icon={ClipboardList} label="Tasks" value={data.totalTasks} />
              <StatCard icon={MessageSquare} label="Channels" value={data.channels.length} />
              <StatCard icon={FileText} label="Files" value={data.files.length} />
              <StatCard
                icon={ClipboardList}
                label="Lanes"
                value={data.lanes.length}
              />
            </div>

            {/* Channels */}
            <section>
              <h2 className="mb-4 text-lg font-semibold">Channels</h2>
              {data.channels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No channels yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.channels.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/portal/dashboard/${projectId}/channels/${ch.id}`}
                      className="glass-card flex items-center gap-3 rounded-xl p-4 transition hover:border-gold/40"
                    >
                      <MessageSquare className="h-5 w-5 text-gold" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{ch.name}</p>
                        {ch.description && (
                          <p className="text-xs text-muted-foreground truncate">{ch.description}</p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        {ch._count.messages}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Recent messages */}
            <section>
              <h2 className="mb-4 text-lg font-semibold">Recent messages</h2>
              {data.recentMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet.</p>
              ) : (
                <div className="space-y-3">
                  {data.recentMessages.map((msg) => (
                    <div key={msg.id} className="glass-card rounded-xl p-4">
                      <div className="mb-1 flex items-center gap-2">
                        <AuthorAvatar author={msg.author} />
                        <span className="text-sm font-medium">{msg.author.name}</span>
                        <span className="text-xs text-muted-foreground">
                          in #{msg.channel.name}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          <Clock className="mr-1 inline h-3 w-3" />
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-2">{msg.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Files */}
            <section>
              <h2 className="mb-4 text-lg font-semibold">Files</h2>
              {data.files.length === 0 ? (
                <p className="text-sm text-muted-foreground">No files shared yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.files.map((f) => (
                    <a
                      key={f.id}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-card flex items-center gap-3 rounded-xl p-4 transition hover:border-gold/40"
                    >
                      <FileText className="h-5 w-5 text-teal-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(f.sizeBytes / 1024).toFixed(0)} KB
                        </p>
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              )}
            </section>

            {/* Task lanes overview */}
            {data.lanes.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold">Task overview</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {data.lanes.map((lane) => (
                    <div key={lane.id} className="glass-card rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{lane.taskCount}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{lane.name}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : null}

        {branding?.showPoweredBy !== false && (
          <p className="mt-10 text-center text-[11px] text-muted-foreground">
            Powered by <span className="font-semibold">CollabSpace</span>
          </p>
        )}
      </div>
    </div>
  );
}

function SetPasswordCard({ email }: { email?: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (dismissed || done) {
    return done ? (
      <div className="glass-card rounded-xl border-teal-500/30 p-4 text-sm text-muted-foreground">
        Password set — you can now sign in with <strong>{email}</strong> from the login page anytime.
      </div>
    ) : null;
  }

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await portalApi.post('/portal/set-password', { password });
      setDone(true);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Could not set password.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Set a password to log in anytime</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Optional — you can always re-open this portal with a magic link sent to your email.
          </p>
          {open && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (min 8 characters)"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                onClick={submit}
                disabled={submitting || password.length < 8}
                className="primary-button px-4 py-2 text-sm disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save password'}
              </button>
            </div>
          )}
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
        {open ? null : (
          <button onClick={() => setOpen(true)} className="secondary-button shrink-0 px-3 py-1.5 text-xs">
            Set password
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="glass-card flex flex-col items-center rounded-xl p-4">
      <Icon className="mb-2 h-5 w-5 text-gold" />
      <span className="text-2xl font-bold">{value}</span>
      <span className="mt-0.5 text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function AuthorAvatar({ author }: { author: Pick<User, 'id' | 'name' | 'avatarUrl'> }) {
  return author.avatarUrl ? (
    <img src={author.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
  ) : (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-gold">
      {author.name?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}
