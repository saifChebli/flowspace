'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (requestError: unknown) {
      const message =
        (requestError as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Unable to request a password reset right now.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hero-grid relative flex min-h-screen items-center justify-center overflow-hidden p-4 md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(183,121,31,0.18),transparent_22%),radial-gradient(circle_at_82%_78%,rgba(15,118,110,0.16),transparent_24%)]" />
      <div className="glass-card relative w-full max-w-xl rounded-4xl p-8 md:p-10">
        <div className="eyebrow">Recovery</div>
        <h2 className="mb-3 mt-5 text-3xl font-bold">Recover workspace access</h2>
        <p className="mb-6 text-sm leading-6 text-muted-foreground">
          Enter your email and we&apos;ll send you a secure reset link so you can get back into your projects.
        </p>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-accent-soft px-4 py-3 text-sm text-foreground">
              If that account exists, a reset link has been sent.
            </div>
            <Link href="/auth/login" className="text-sm font-semibold text-accent hover:underline">
              Back to sign in
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
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="field-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-button w-full px-4 py-3.5 text-sm disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}