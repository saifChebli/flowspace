'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const NAV = [
  { label: 'Overview', href: '/admin' },
  { label: 'Workspaces', href: '/admin/workspaces' },
  { label: 'Users', href: '/admin/users' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/auth/login'); return; }
    if (user && !user.isPlatformAdmin) router.replace('/dashboard');
  }, [isAuthenticated, user, router]);

  if (!user?.isPlatformAdmin) return null;

  return (
    <div className="app-shell min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
        {/* Header */}
        <div className="glass-card mb-6 rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="eyebrow">Platform</div>
              <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight">
                <ShieldCheck className="h-5 w-5 text-gold" />
                Admin console
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Platform-wide oversight across every workspace, user, and project.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="secondary-button flex items-center gap-1.5 px-3 py-2 text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to app
            </Link>
          </div>

          {/* Tabs */}
          <div className="mt-5 flex flex-wrap gap-1.5">
            {NAV.map((item) => {
              const active = item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
                    active
                      ? 'border-accent/25 bg-accent-soft text-accent shadow-sm'
                      : 'border-transparent bg-white/40 text-muted-foreground hover:border-border/60 hover:bg-white/80 hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
