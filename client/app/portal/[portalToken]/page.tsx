'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import portalApi from '@/lib/portalApi';
import { toast } from 'sonner';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { PortalProject } from '@/types';

export default function PortalLandingPage() {
  const { portalToken } = useParams<{ portalToken: string }>();
  const [project, setProject] = useState<PortalProject | null>(null);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    portalApi
      .get(`/portal/${portalToken}`)
      .then(({ data }) => setProject(data))
      .catch(() => setError('Invalid portal link'))
      .finally(() => setPageLoading(false));
  }, [portalToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await portalApi.post(`/portal/${portalToken}/magic-link`, { email });
      setSent(true);
      toast.success('Magic link sent! Check your inbox.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to send magic link.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass-card max-w-md rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Invalid Portal Link</h1>
          <p className="mt-3 text-muted-foreground">
            This link is no longer valid. Contact your project team for a new one.
          </p>
        </div>
      </div>
    );
  }

  const branding = project.branding;

  return (
    <div
      className="hero-grid relative flex min-h-screen items-center justify-center overflow-hidden p-4 md:p-8"
      style={branding?.accentColor ? ({ ['--gold' as string]: branding.accentColor }) : undefined}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(183,121,31,0.18),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(15,118,110,0.18),transparent_24%)]" />

      <div className="glass-card relative w-full max-w-md rounded-2xl p-7 md:p-10">
        <div className="mb-8">
          {branding?.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={branding.logoUrl} alt={branding.name ?? ''} className="mb-4 h-9 w-auto object-contain" />
          ) : null}
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            {branding?.name ?? 'Client Portal'}
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">{project.name}</h2>
          {project.description && (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description}</p>
          )}
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-teal-500" />
            <h3 className="text-xl font-semibold">Check your email</h3>
            <p className="text-sm text-muted-foreground">
              We sent a magic link to <strong>{email}</strong>. Click it to access your portal.
              Bookmark it for quick access — it stays valid for 90 days.
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <p className="mb-5 text-sm text-muted-foreground">
              Enter your email to receive a magic link. No password needed.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white/60 py-2.5 pl-10 pr-4 text-sm transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-sm font-semibold text-white shadow transition hover:bg-gold/90 disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    Send magic link <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {branding?.showPoweredBy !== false && (
          <p className="mt-8 text-center text-[11px] text-muted-foreground">
            Powered by <span className="font-semibold">CollabSpace</span>
          </p>
        )}
      </div>
    </div>
  );
}
