'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import portalApi from '@/lib/portalApi';

export default function PortalInviteAcceptPage() {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    portalApi
      .post(`/portal/invite/${inviteToken}/accept`)
      .then(({ data }) => {
        // Hand off to the session page, which validates + stores the full session
        // and redirects to the client dashboard.
        router.replace(`/portal/session/${data.sessionToken}`);
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.error ?? 'This invite link is invalid or has expired.';
        setError(msg);
      });
  }, [inviteToken, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass-card max-w-md rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Invite Error</h1>
          <p className="mt-3 text-muted-foreground">{error}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            If your team already gave you a portal link, open it and request a new access link with your email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
        <p className="text-sm text-muted-foreground">Setting up your portal…</p>
      </div>
    </div>
  );
}
