import Link from 'next/link';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="text-xs font-medium text-muted-foreground hover:text-foreground">
          ← Back to CollabSpace
        </Link>
        <article className="glass-card mt-6 rounded-2xl p-8 md:p-10">{children}</article>
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
        </div>
      </div>
    </div>
  );
}
