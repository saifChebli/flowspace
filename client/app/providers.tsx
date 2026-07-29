'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';
import { initSentry } from '@/lib/sentry';
import { useAuthStore } from '@/stores/authStore';

export default function Providers({ children }: { children: React.ReactNode }) {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);

  // Persisted state only exists on the client, so decide after mount — otherwise
  // SSR (logged out) and first client render (logged in) disagree and React warns.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initSentry();
    bootstrap();
  }, [bootstrap]);

  // The access token is memory-only, so after a reload a persisted session needs
  // re-minting from the refresh cookie. Hold render for just that case — logged-out
  // visitors and the marketing page are unaffected.
  const restoringSession = mounted && isAuthenticated && !accessToken && !bootstrapped;

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 min
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {restoringSession ? (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
        </div>
      ) : (
        children
      )}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(255, 250, 241, 0.95)',
            border: '1px solid rgba(214, 200, 177, 0.9)',
            color: '#172033',
            borderRadius: '1rem',
            boxShadow: '0 12px 40px rgba(23, 32, 51, 0.12)',
            backdropFilter: 'blur(12px)',
          },
        }}
        richColors
      />
    </QueryClientProvider>
  );
}
