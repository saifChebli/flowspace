import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact — CollabSpace',
  description: 'How to reach the CollabSpace team.',
};

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@collabspace.io';

export default function ContactPage() {
  return (
    <>
      <div className="eyebrow">Support</div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Contact us</h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        We&apos;re a small team in public beta and we read everything that comes in.
      </p>

      <div className="mt-8 space-y-4">
        <div className="soft-row rounded-xl px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">General &amp; support</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-1 block text-base font-semibold text-accent underline">
            {SUPPORT_EMAIL}
          </a>
          <p className="mt-1 text-xs text-muted-foreground">
            Include your workspace name so we can find your account quickly.
          </p>
        </div>

        <div className="soft-row rounded-xl px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Privacy &amp; data requests</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-1 block text-base font-semibold text-accent underline">
            {SUPPORT_EMAIL}
          </a>
          <p className="mt-1 text-xs text-muted-foreground">
            You can export a full workspace archive yourself from workspace settings at any time — see our{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>

        <div className="soft-row rounded-xl px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Security reports</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-1 block text-base font-semibold text-accent underline">
            {SUPPORT_EMAIL}
          </a>
          <p className="mt-1 text-xs text-muted-foreground">
            Found a vulnerability? Please report it privately first and give us a chance to fix it.
          </p>
        </div>
      </div>
    </>
  );
}
