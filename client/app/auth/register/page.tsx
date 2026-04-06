'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import Logo from '@/components/ui/Logo';

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterInner />
    </Suspense>
  );
}

function RegisterInner() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirectTo = rawRedirect?.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!name.trim() || name.trim().length < 2) {
      const msg = 'Please enter your full name (at least 2 characters).';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!email.trim()) {
      const msg = 'Please enter your email address.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      const msg = 'Please enter a valid email address.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (password.length < 8) {
      const msg = 'Password must be at least 8 characters long.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!/[A-Z]/.test(password)) {
      const msg = 'Password must contain at least one uppercase letter.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!/[0-9]/.test(password)) {
      const msg = 'Password must contain at least one number.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { name: name.trim(), email: email.trim(), password });
      toast.success('Account created! Please check your email to verify your account.');
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Registration failed. Please try again or use a different email.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="hero-grid flex min-h-screen items-center justify-center p-4 md:p-8">
        <div className="glass-card w-full max-w-lg rounded-2xl p-8 text-center md:p-10">
          <div className="mb-4 flex justify-center"><Logo /></div>
          <div className="eyebrow mx-auto w-fit">Almost there</div>
          <h2 className="mb-3 mt-5 text-3xl font-bold">Check your inbox</h2>
          <p className="mb-6 text-base leading-7 text-muted-foreground">
            We sent a verification link to <strong>{email}</strong>. Click it to activate your
            account.
          </p>
          <button
            onClick={() => router.push(redirectTo ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}` : '/auth/login')}
            className="primary-button px-6 py-3 text-sm"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-grid relative flex min-h-screen items-center justify-center overflow-hidden p-4 md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(183,121,31,0.18),transparent_24%),radial-gradient(circle_at_85%_75%,rgba(15,118,110,0.16),transparent_24%)]" />
      <div className="relative grid w-full max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden rounded-2xl border border-border/80 bg-white/55 p-8 shadow-lg backdrop-blur xl:flex xl:flex-col xl:justify-between">
          <div>
            <div className="eyebrow">Create workspace</div>
            <h1 className="mt-6 text-5xl font-bold leading-[0.95] tracking-[-0.04em]">
              Start with one project hub. Scale without tool sprawl.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-ink-soft">
              Bring team coordination, client collaboration, file delivery, and board movement into one project-native surface.
            </p>
          </div>

          <div className="grid gap-4">
            <AuthFeature title="Designed for service delivery">
              Built for freelancers, agencies, and remote product teams that need crisp client communication.
            </AuthFeature>
            <AuthFeature title="Project-first permissions">
              Keep internal work private while exposing only the channels, tasks, and files your client needs.
            </AuthFeature>
          </div>
        </section>

        <div className="glass-card w-full rounded-2xl p-7 md:p-10">
          <div className="mb-8">
            <div className="mb-4"><Logo /></div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              New account
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Create your CollabSpace identity</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Spin up a workspace, invite collaborators, and keep every project conversation anchored to delivery.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field-input"
              />
            </div>

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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Min 8 chars, one uppercase, one number.
              </p>
            </div>

            <button type="submit" disabled={loading} className="primary-button flex w-full items-center justify-center gap-2 px-4 py-3 text-sm disabled:opacity-60">
              <UserPlus className="h-4 w-4" />
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-accent hover:underline">
              Sign in
            </Link>
          </p>
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
