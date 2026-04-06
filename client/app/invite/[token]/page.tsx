'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [acceptData, setAcceptData] = useState<{ role?: string; workspaceSlug?: string; projectId?: string; slug?: string } | null>(null);

  const accept = useMutation({
    mutationFn: () =>
      // Try workspace invite first; if it returns 400 (wrong type), fall back to project invite
      api.post(`/workspaces/invites/${token}/accept`).catch(async (err) => {
        if (err?.response?.status === 400 && err.response.data?.error?.includes('Invalid invite type')) {
          // Retry as project invite
          const workspaceSlug = new URLSearchParams(window.location.search).get('ws') ?? '_';
          return api.post(`/workspaces/${workspaceSlug}/projects/invites/${token}/accept`);
        }
        throw err;
      }),
    onSuccess: (res) => {
      setAcceptData(res?.data ?? null);
      setStatus('success');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to accept invite.';
      setErrorMsg(msg);
      setStatus('error');
    },
  });

  // Auto-accept once authenticated
  useEffect(() => {
    if (isAuthenticated && status === 'idle') {
      accept.mutate();
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated) {
    return (
      <div className="hero-grid flex min-h-screen items-center justify-center p-4">
        <div className="glass-card w-full max-w-md rounded-2xl p-8 text-center">
          <div className="eyebrow mx-auto mb-4 w-fit">Workspace invite</div>
          <h2 className="mb-3 text-2xl font-bold">You&apos;ve been invited</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Sign in or create an account to accept this invitation.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/auth/login?redirect=/invite/${token}`}
              className="primary-button w-full py-3 text-sm text-center"
            >
              Sign in to accept
            </Link>
            <Link
              href={`/auth/register?redirect=/invite/${token}`}
              className="secondary-button w-full py-3 text-sm text-center"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (accept.isPending || status === 'idle') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Accepting invite…</p>
      </div>
    );
  }

  if (status === 'success') {
    const isClient = acceptData?.role === 'CLIENT';
    // Build redirect URL: project invite → /{workspaceSlug}/{projectId}, workspace invite → /{slug}
    const destination = acceptData?.workspaceSlug && acceptData?.projectId
      ? `/${acceptData.workspaceSlug}/${acceptData.projectId}`
      : acceptData?.slug
        ? `/${acceptData.slug}`
        : '/dashboard';

    return (
      <div className="hero-grid flex min-h-screen items-center justify-center p-4">
        <div className="glass-card w-full max-w-md rounded-2xl p-8 text-center">
          <div className="mb-4 text-4xl">🎉</div>
          <h2 className="mb-3 text-2xl font-bold">Welcome aboard!</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {isClient
              ? 'You\u2019ve joined as a client. Your project team will share a portal link for easy access.'
              : 'You\u2019ve successfully joined. Redirecting you now\u2026'}
          </p>
          <button
            onClick={() => router.push(destination)}
            className="primary-button px-6 py-3 text-sm"
          >
            {isClient ? 'Go to dashboard' : 'Go to project'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-grid flex min-h-screen items-center justify-center p-4">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 text-center">
        <div className="mb-4 text-4xl">⚠️</div>
        <h2 className="mb-3 text-2xl font-bold">Invite error</h2>
        <p className="mb-6 text-sm text-muted-foreground">{errorMsg}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="secondary-button px-6 py-3 text-sm"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}
