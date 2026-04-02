'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('error'); return; }

    api
      .get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  if (status === 'loading') {
    return <p className="text-muted-foreground">Verifying…</p>;
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <h2 className="mb-3 text-xl font-bold">Email verified!</h2>
        <p className="mb-6 text-sm text-muted-foreground">Your account is now active.</p>
        <button
          onClick={() => router.push('/auth/login')}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="mb-3 text-xl font-bold text-destructive">Verification failed</h2>
      <p className="text-sm text-muted-foreground">
        This link is invalid or expired. Please register again or request a new link.
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
