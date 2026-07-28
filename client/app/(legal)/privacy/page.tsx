import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — CollabSpace',
  description: 'What data CollabSpace collects, why, and the rights you have over it.',
};

const UPDATED = 'July 2026';

export default function PrivacyPage() {
  return (
    <>
      <div className="eyebrow">Legal</div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {UPDATED}</p>

      <div className="prose-legal mt-8 space-y-6 text-sm leading-7 text-foreground/85">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Who we are</h2>
          <p>
            CollabSpace is a collaboration workspace for freelancers, agencies, and their clients.
            This policy explains what we collect, why we collect it, and what control you have.
            We are currently in public beta.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. What we collect</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><strong>Account data</strong> — your name, email address, and a securely hashed password (we never store your password in plain text). Client portal users may have an account with no password at all.</li>
            <li><strong>Content you create</strong> — workspaces, projects, tasks, messages, comments, and files you upload.</li>
            <li><strong>Activity data</strong> — a log of actions within a project (task created, file uploaded, member joined) used to power dashboards and the audit log.</li>
            <li><strong>Technical data</strong> — standard server logs, including IP address and browser user-agent, used for security and debugging.</li>
          </ul>
          <p className="mt-2">We do not sell your data, and we do not use it to train AI models.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Cookies</h2>
          <p>
            We use a single essential cookie: an <code>httpOnly</code> refresh-token cookie that keeps you
            signed in. It is not used for advertising or cross-site tracking. Clearing it signs you out.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Service providers</h2>
          <p>We share data only with the providers required to run the service:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><strong>Supabase</strong> — PostgreSQL database hosting (stores your account and content data).</li>
            <li><strong>Cloudinary</strong> — storage and delivery of files you upload.</li>
            <li><strong>Vercel</strong> — hosting for the web application.</li>
            <li><strong>Email delivery (SMTP)</strong> — transactional email such as verification, password reset, invitations, and notifications.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Security</h2>
          <p>
            Data is encrypted in transit using HTTPS/TLS and encrypted at rest by our database provider.
            Passwords are hashed with bcrypt. Client portal access uses expiring session tokens rather
            than shared passwords. As a beta-stage product we do not currently hold formal certifications
            such as SOC 2 or ISO 27001, and we will say so plainly rather than imply otherwise.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Your rights</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li><strong>Export</strong> — download all of a workspace&apos;s projects, tasks, conversations, and files as a ZIP archive from workspace settings, at any time, without contacting support.</li>
            <li><strong>Deletion</strong> — delete a workspace from its settings, which permanently removes its projects, channels, tasks, and files. To delete your user account entirely, contact us.</li>
            <li><strong>Access and correction</strong> — your profile and workspace data are editable in-app; contact us for anything you cannot change yourself.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Data retention</h2>
          <p>
            We keep your data for as long as your account is active. Deleted workspaces are removed from
            the live database immediately; backups may retain copies for a limited period before rotating out.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Changes and contact</h2>
          <p>
            We will update this page when our practices change and revise the date above. Questions about
            privacy or a data request can be sent via our <Link href="/contact" className="text-accent underline">contact page</Link>.
          </p>
        </section>
      </div>
    </>
  );
}
