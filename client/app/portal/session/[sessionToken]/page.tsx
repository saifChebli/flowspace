'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import portalApi from '@/lib/portalApi';
import { usePortalStore } from '@/stores/portalStore';

export default function PortalSessionPage() {
  const { sessionToken } = useParams<{ sessionToken: string }>();
  const [error, setError] = useState('');
  const router = useRouter();
  const setSession = usePortalStore((s) => s.setSession);

  useEffect(() => {
    portalApi
      .get(`/portal/session/${sessionToken}`)
      .then(({ data }) => {
        setSession(data);
        router.replace(`/portal/dashboard/${data.projectId}`);
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.error ?? 'Session invalid or expired. Request a new magic link.';
        setError(msg);
      });
  }, [sessionToken, router, setSession]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass-card max-w-md rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Session Error</h1>
          <p className="mt-3 text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
        <p className="text-sm text-muted-foreground">Validating session…</p>
      </div>
    </div>
  );
}
