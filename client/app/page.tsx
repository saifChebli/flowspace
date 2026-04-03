'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);
  return (
    <main className="hero-grid relative isolate min-h-screen overflow-hidden px-6 py-8 md:px-10 md:py-10">
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/55 to-transparent" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-between gap-14">
        <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="eyebrow">CollabSpace Workspace OS</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/auth/login" className="secondary-button px-5 py-3 text-sm">
              Sign in
            </Link>
            <Link href="/auth/register" className="primary-button px-5 py-3 text-sm">
              Start a workspace
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.9fr]">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm uppercase tracking-[0.22em] text-gold">
              Messaging, tasks, files, and client visibility in one flow
            </p>
            <h1 className="max-w-4xl text-5xl font-bold leading-[0.92] tracking-[-0.04em] text-foreground md:text-7xl">
              Stop duct-taping tools together for every project.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft md:text-xl">
              CollabSpace gives freelancers and remote teams one per-project control room with
              channels, delivery boards, file approvals, and a clean client portal.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/auth/register" className="primary-button px-7 py-4 text-base">
                Launch your first workspace
              </Link>
              <Link href="/auth/login" className="secondary-button px-7 py-4 text-base">
                Explore existing projects
              </Link>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <FeatureStat value="4x" label="Less context switching across tools" />
              <FeatureStat value="Live" label="Client-safe channels and handoffs" />
              <FeatureStat value="1 tab" label="For delivery, comms, and status" />
            </div>
          </div>

          <div className="glass-card relative overflow-hidden rounded-[2rem] p-5 md:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(183,121,31,0.16),transparent_30%)]" />
            <div className="relative space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-white/60 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Active workspace
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">Northstar Studio</h2>
                </div>
                <div className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                  12 collaborators live
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
                <div className="panel-card rounded-[1.5rem] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Client Launch Channel</p>
                    <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">
                      Live
                    </span>
                  </div>
                  <div className="mt-4 space-y-3 text-sm">
                    <ChatPreview
                      name="Priya"
                      tone="bg-white"
                      text="Homepage approved. Shipping final copy and invoice packet this afternoon."
                    />
                    <ChatPreview
                      name="Carlos"
                      tone="bg-accent-soft"
                      text="Perfect. Keep client view limited to launch checklist and uploads."
                    />
                    <ChatPreview
                      name="Alex"
                      tone="bg-white"
                      text="Done. Board moved to final QA and files tab has the launch deck."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="panel-card rounded-[1.5rem] p-4">
                    <p className="text-sm font-semibold">Delivery board</p>
                    <div className="mt-4 grid gap-3">
                      <MiniColumn title="Backlog" count="3" accent="bg-white">
                        Final invoice
                      </MiniColumn>
                      <MiniColumn title="In review" count="2" accent="bg-accent-soft">
                        Client portal polish
                      </MiniColumn>
                      <MiniColumn title="Ready" count="4" accent="bg-[#fff3d7]">
                        Launch assets
                      </MiniColumn>
                    </div>
                  </div>

                  <div className="panel-card rounded-[1.5rem] p-4">
                    <p className="text-sm font-semibold">Why teams switch</p>
                    <ul className="mt-4 space-y-3 text-sm text-ink-soft">
                      <li>Shared context stays attached to the project, not lost in chat history.</li>
                      <li>Clients only see what you intentionally expose.</li>
                      <li>Tasks, files, and decisions move together in real time.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-tile">
      <div className="text-3xl font-bold tracking-tight text-foreground">{value}</div>
      <p className="mt-2 text-sm text-ink-soft">{label}</p>
    </div>
  );
}

function ChatPreview({ name, text, tone }: { name: string; text: string; tone: string }) {
  return (
    <div className={`rounded-2xl ${tone} border border-border/60 p-3`}>
      <div className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {name}
      </div>
      <p className="leading-6 text-foreground">{text}</p>
    </div>
  );
}

function MiniColumn({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl ${accent} border border-border/70 p-3`}>
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>{title}</span>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <p className="mt-2 text-sm text-ink-soft">{children}</p>
    </div>
  );
}
