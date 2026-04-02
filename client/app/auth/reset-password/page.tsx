'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('Missing reset token. Use the link from your email.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (requestError: unknown) {
      const message =
        (requestError as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Unable to reset your password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card w-full max-w-xl rounded-4xl p-8 md:p-10">
      <div className="eyebrow">Secure reset</div>
      <h2 className="mb-3 mt-5 text-3xl font-bold">Set a new password</h2>
      <p className="mb-6 text-sm leading-6 text-muted-foreground">
        Choose a new password for your account.
      </p>

      {success ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-foreground">
            Your password has been updated.
          </div>
          <Link href="/auth/login" className="text-sm font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              New password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="field-input"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Min 8 chars, one uppercase, one number.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="primary-button w-full px-4 py-3.5 text-sm disabled:opacity-60"
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="hero-grid relative flex min-h-screen items-center justify-center overflow-hidden p-4 md:p-8">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}