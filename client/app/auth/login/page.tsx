'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { LogIn, Eye, MessageSquare } from 'lucide-react';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirectTo = rawRedirect?.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!email.trim()) {
      setError('Please enter your email address.');
      toast.error('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      toast.error('Please enter your password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! Redirecting…');
      router.push(redirectTo || '/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Unable to sign in. Please check your credentials and try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hero-grid relative flex min-h-screen items-center justify-center overflow-hidden p-4 md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(183,121,31,0.18),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.18),transparent_24%)]" />
      <div className="relative grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden rounded-2xl border border-border/80 bg-white/55 p-8 shadow-lg backdrop-blur xl:flex xl:flex-col xl:justify-between">
          <div>
            <div className="eyebrow">Operator login</div>
            <h1 className="mt-6 text-5xl font-bold leading-[0.95] tracking-[-0.04em] text-foreground">
              Run every project from one calm control room.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-ink-soft">
              Keep delivery threads, task movement, and client-visible updates connected instead of split between chat, docs, and boards.
            </p>
          </div>

          <div className="grid gap-4">
            <AuthFeature title="Client-safe visibility">
              Share progress without exposing internal notes, side threads, or delivery noise.
            </AuthFeature>
            <AuthFeature title="Real-time handoff">
              Team members see channel replies, task changes, and launch files in one place.
            </AuthFeature>
          </div>
        </section>

        <div className="glass-card w-full rounded-2xl p-7 md:p-10">
          <div className="mb-8">
            <div className="mb-4"><Logo /></div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Sign in
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Welcome back to CollabSpace</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Step into your workspace, review project health, and pick up the conversation where it left off.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
              />
            </div>

            <button type="submit" disabled={loading} className="primary-button flex w-full items-center justify-center gap-2 px-4 py-3 text-sm disabled:opacity-60">
              <LogIn className="h-4 w-4" />
              {loading ? 'Signing in…' : 'Enter workspace'}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-between">
            <p className="text-muted-foreground">
              No account?{' '}
              <Link href="/auth/register" className="font-semibold text-accent hover:underline">
                Create one
              </Link>
            </p>
            <Link href="/auth/forgot-password" className="text-muted-foreground hover:text-foreground hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthFeature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/80 bg-white/60 p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-ink-soft">{children}</p>
    </div>
  );
}
