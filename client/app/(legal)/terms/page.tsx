import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — CollabSpace',
  description: 'The terms that govern your use of CollabSpace.',
};

const UPDATED = 'July 2026';

export default function TermsPage() {
  return (
    <>
      <div className="eyebrow">Legal</div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {UPDATED}</p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-foreground/85">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Agreement</h2>
          <p>
            By creating an account or using CollabSpace you agree to these terms. If you are using
            CollabSpace on behalf of an organisation, you confirm you have authority to accept these
            terms for that organisation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Beta status</h2>
          <p>
            CollabSpace is in public beta. The service is provided &ldquo;as is&rdquo;: features may
            change, and while we work hard to keep it stable, we do not currently offer a contractual
            uptime guarantee or SLA. We recommend keeping your own backups of critical data — you can
            export a full workspace archive at any time.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Your account</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>You are responsible for keeping your credentials secure and for activity under your account.</li>
            <li>You must provide an accurate email address so we can send essential service messages.</li>
            <li>You must be legally able to enter into this agreement in your jurisdiction.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Your content</h2>
          <p>
            You retain ownership of everything you upload or create. You grant us only the limited
            licence needed to host, process, and display that content in order to operate the service
            for you and the people you share it with.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Acceptable use</h2>
          <p>You agree not to use CollabSpace to:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>break the law, or infringe someone else&apos;s rights;</li>
            <li>upload malware, or attempt to breach, probe, or overload the service;</li>
            <li>send spam or harass other users;</li>
            <li>attempt to access workspaces or data you have not been granted access to.</li>
          </ul>
          <p className="mt-2">
            We may suspend or remove accounts that violate these rules, generally after notice unless
            the violation is severe or ongoing.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Plans and payment</h2>
          <p>
            A free plan is available. Paid plans, when billed, are charged in advance for the period you
            select and can be cancelled at any time — cancellation stops future charges and takes effect
            at the end of the current period. Prices are shown on our pricing section and may change with
            notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Termination</h2>
          <p>
            You may stop using the service and delete your workspaces at any time. We may suspend or
            terminate accounts for breach of these terms. Before terminating your account, export any
            data you want to keep.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Liability</h2>
          <p>
            To the maximum extent permitted by law, CollabSpace is not liable for indirect or
            consequential losses, or for loss of data or profits arising from use of the service. Nothing
            in these terms limits liability that cannot lawfully be limited.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Changes and contact</h2>
          <p>
            We may update these terms and will revise the date above when we do. Continued use after a
            change means you accept the updated terms. Questions can be sent via our{' '}
            <Link href="/contact" className="text-accent underline">contact page</Link>.
          </p>
        </section>
      </div>
    </>
  );
}
