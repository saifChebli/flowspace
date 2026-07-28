'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center gap-1">
        <span className="mr-3 text-lg font-bold">Platform Admin</span>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname === item.href ? 'bg-accent text-white' : 'text-muted-foreground hover:bg-muted/40'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
