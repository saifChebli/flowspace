'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';
import { initSentry } from '@/lib/sentry';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => { initSentry(); }, []);

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
      {children}
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
