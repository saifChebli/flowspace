'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import './landing.css';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CollabSpace — Marketing Landing Page
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const SECTION_IDS = ['features', 'how-it-works', 'pricing', 'faq'] as const;

interface PublicStats {
  workspaces: number;
  projects: number;
  tasksCompleted: number;
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);

  /* ── Real platform stats (no fabricated social proof) ───── */
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
    fetch(`${base}/public/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStats(d))
      .catch(() => {}); // stats are decorative — never block the page
  }, []);

  /* ── Scroll spy ─────────────────────────────────────────── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { threshold: 0.15, rootMargin: '-80px 0px 0px 0px' }
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  /* ── Scroll reveal ──────────────────────────────────────── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('visible');
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll('.lp-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* ── Hero entrance sequence ─────────────────────────────── */
  useEffect(() => {
    const delays = [0, 150, 300, 450, 600, 750, 900, 1050, 1200, 1400];
    const els = document.querySelectorAll('.lp-hero-item, .lp-hero-mockup');
    const timers: ReturnType<typeof setTimeout>[] = [];
    els.forEach((el, i) => {
      timers.push(setTimeout(() => el.classList.add('animated'), delays[i] ?? 1400));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  /* ── Lock scroll when mobile menu open ──────────────────── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  /* ── Escape key closes mobile menu ──────────────────────── */
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const scrollTo = useCallback((id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, []);

  return (
    <div className="landing">
      {/* ─── 1 · Navbar ──────────────────────────────────────── */}
      <nav className="lp-nav lp-hero-item">
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <LogoMark />
            <span style={{ fontWeight: 600, fontSize: 16, color: 'var(--lp-text)', letterSpacing: '-0.01em' }}>CollabSpace</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex" style={{ gap: 32, alignItems: 'center' }}>
            {SECTION_IDS.map((id) => (
              <button key={id} onClick={() => scrollTo(id)} className={`lp-nav-link ${activeSection === id ? 'active' : ''}`} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                {id === 'how-it-works' ? 'How it Works' : id === 'faq' ? 'FAQ' : id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>

          <div className="hidden md:flex" style={{ gap: 12, alignItems: 'center' }}>
            <Link href="/auth/login" style={{ fontSize: 14, color: 'var(--lp-text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>Log in</Link>
            <Link href="/auth/register" className="lp-cta lp-cta-primary" style={{ padding: '10px 20px', fontSize: 14 }}>Start Free</Link>
          </div>

          {/* Hamburger */}
          <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="Menu">
            <div style={{ width: 22, height: 16, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, width: '100%', height: 2, background: 'var(--lp-text)', borderRadius: 1, transition: 'all 0.3s', top: menuOpen ? 7 : 0, transform: menuOpen ? 'rotate(45deg)' : 'none' }} />
              <span style={{ position: 'absolute', left: 0, width: '100%', height: 2, background: 'var(--lp-text)', borderRadius: 1, top: 7, opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s' }} />
              <span style={{ position: 'absolute', left: 0, width: '100%', height: 2, background: 'var(--lp-text)', borderRadius: 1, transition: 'all 0.3s', top: menuOpen ? 7 : 14, transform: menuOpen ? 'rotate(-45deg)' : 'none' }} />
            </div>
          </button>
        </div>
      </nav>

      {/* ─── Mobile overlay ──────────────────────────────────── */}
      <div className={`lp-mobile-overlay ${menuOpen ? 'open' : ''}`}>
        {SECTION_IDS.map((id) => (
          <button key={id} onClick={() => scrollTo(id)} style={{ background: 'none', border: 'none', color: 'var(--lp-text)', fontSize: 28, fontWeight: 600, cursor: 'pointer' }}>
            {id === 'how-it-works' ? 'How it Works' : id === 'faq' ? 'FAQ' : id.charAt(0).toUpperCase() + id.slice(1)}
          </button>
        ))}
        <Link href="/auth/register" className="lp-cta lp-cta-primary" style={{ padding: '14px 32px', fontSize: 18, marginTop: 16 }} onClick={() => setMenuOpen(false)}>Start Free</Link>
      </div>

      {/* ─── 2 · Hero ────────────────────────────────────────── */}
      <section style={{ position: 'relative', paddingTop: 80, paddingBottom: 60 }}>
        {/* Subtle atmospheric glow */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(15,118,110,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', padding: '0 24px', position: 'relative' }}>
          {/* Badge */}
          <div className="lp-hero-item" style={{ marginBottom: 32 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(216,239,232,0.8)', border: '1px solid rgba(15,118,110,0.25)', borderRadius: 100, padding: '6px 16px', fontSize: 13, color: 'var(--lp-accent)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lp-accent)', animation: 'lp-pulse 2s ease-in-out infinite' }} />
              ✦ Now in public beta — free forever plan available
            </span>
          </div>

          {/* Headline */}
          <h1 style={{ margin: 0, lineHeight: 1.05 }}>
            <span className="lp-hero-item" style={{ display: 'block', fontSize: 'clamp(40px, 5.5vw, 72px)', fontWeight: 600 }}>One workspace for</span>
            <span className="lp-hero-item" style={{ display: 'block', fontSize: 'clamp(40px, 5.5vw, 72px)', fontStyle: 'italic', fontFamily: 'var(--font-instrument-serif, "Instrument Serif", serif)', fontWeight: 400 }}>every project.</span>
            <span className="lp-hero-item" style={{ display: 'block', fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 600, color: 'var(--lp-accent)' }}>Zero chaos.</span>
          </h1>

          {/* Sub-headline */}
          <p className="lp-hero-item" style={{ maxWidth: 600, margin: '28px auto 0', fontSize: 18, color: 'var(--lp-text-secondary)', lineHeight: 1.7 }}>
            Stop juggling Slack, Trello, and email threads. CollabSpace gives your team
            and clients one shared workspace — with real-time channels, task boards,
            and a beautiful client portal.
          </p>

          {/* CTA group */}
          <div className="lp-hero-item" style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/auth/register" className="lp-cta lp-cta-primary" style={{ padding: '16px 32px', fontSize: 16 }}>Start Free — No credit card</Link>
              <button onClick={() => scrollTo('features')} style={{ background: 'none', border: 'none', color: 'var(--lp-text-secondary)', fontSize: 16, cursor: 'pointer', transition: 'color 0.2s' }}>See how it works →</button>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Free forever plan', 'No credit card needed', 'Setup in 2 minutes'].map((t) => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--lp-text-muted)' }}>
                  <span style={{ color: 'var(--lp-accent-2)' }}>✓</span> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Stats row — real platform numbers, hidden until there's data to show */}
          {stats && stats.workspaces > 0 && (
            <div className="lp-hero-item" style={{ marginTop: 48, display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
              {[
                { n: stats.workspaces, l: stats.workspaces === 1 ? 'Workspace' : 'Workspaces' },
                { n: stats.projects, l: stats.projects === 1 ? 'Active project' : 'Active projects' },
                { n: stats.tasksCompleted, l: 'Tasks completed' },
              ].map((s) => (
                <div key={s.l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--lp-text)' }}>{s.n.toLocaleString()}</div>
                  <div style={{ fontSize: 13, color: 'var(--lp-text-secondary)' }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hero browser mockup */}
        <div style={{ maxWidth: 1100, margin: '64px auto 0', padding: '0 24px' }}>
          <div className="lp-hero-mockup lp-reflect">
            <HeroBrowserMockup />
          </div>
        </div>
      </section>

      {/* ─── 3 · Value bar ───────────────────────────────────── */}
      <section className="lp-reveal" style={{ background: 'var(--lp-bg-surface)', borderTop: '1px solid var(--lp-border)', borderBottom: '1px solid var(--lp-border)', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--lp-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>Everything a client project needs, in one place</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-evenly', alignItems: 'center', gap: '16px 40px' }}>
            {['Real-time channels', 'Kanban boards', 'File sharing', 'Client portal', '@mentions', 'Activity log'].map((n) => (
              <span key={n} style={{ fontWeight: 600, fontSize: 15, color: 'var(--lp-text-muted)' }}>{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4 · The Problem ──────────────────────────────────── */}
      <section className="lp-section lp-reveal" style={{ textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lp-accent)' }}>The Problem</span>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 600, marginTop: 16, lineHeight: 1.2 }}>You&apos;re running your project across 6 apps.</h2>
          <p style={{ marginTop: 20, color: 'var(--lp-text-secondary)', fontSize: 17 }}>
            Slack for messages. Trello for tasks. Email for client updates. Google Drive for files.
            Notion for docs. And a calendar app to keep track of all of it. Every tool is a context
            switch. Every switch is lost momentum. And your clients still don&apos;t know what&apos;s happening.
          </p>
          <ChaosMap />
        </div>
      </section>

      {/* ─── 5 · Features ─────────────────────────────────────── */}
      <section id="features" className="lp-section" style={{ display: 'flex', flexDirection: 'column', gap: 120 }}>
        <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto' }} className="lp-reveal">
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lp-accent)' }}>Features</span>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 600, marginTop: 16, lineHeight: 1.2 }}>Everything your project needs. Nothing it doesn&apos;t.</h2>
        </div>

        {/* Feature 1: Channels */}
        <FeatureRow imageSide="left" className="lp-reveal"
          mockup={<ChannelMockup />}
          pill="Messaging"
          title="Real-time channels, not endless email threads"
          body="Every project gets its own set of channels. Keep team conversations in Public channels, sensitive discussions in Private ones, and use Client channels so your clients stay in the loop — without seeing your internal chaos."
          bullets={['Public, Private, and Client-visible channels per project', '@mentions that actually notify people', 'File attachments up to 25 MB, right in the conversation']}
        />

        {/* Feature 2: Kanban */}
        <FeatureRow imageSide="right" className="lp-reveal"
          mockup={<KanbanMockup />}
          pill="Task Management"
          title="Kanban boards without the complexity"
          body="Create task boards for each project. Drag tasks between columns as work progresses. Assign team members, set due dates, mark priorities — and let your clients see exactly where everything stands."
          bullets={['Drag-and-drop between To Do, In Progress, Review, Done', 'Assignees, due dates, priorities, and file attachments per task', 'Clients get a read-only view — no accidental edits']}
        />

        {/* Feature 3: Client Portal */}
        <FeatureRow imageSide="left" className="lp-reveal"
          mockup={<PortalMockup />}
          pill="Client Portal"
          title="Clients stay informed. Without the email chains."
          body="Every project comes with a branded client portal. Send your client a magic link — they get a clean, professional view of their project's progress, active tasks, and shared files. No account creation. No internal noise. Just what they need to see."
          bullets={['Branded with your agency logo and colors', 'Magic-link access — no password required for clients', 'Clients see progress, milestones, CLIENT channels, and files only']}
        />
      </section>

      {/* ─── 6 · How it Works ─────────────────────────────────── */}
      <section id="how-it-works" className="lp-section lp-reveal">
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 64px' }}>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lp-accent)' }}>How it works</span>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 600, marginTop: 16, lineHeight: 1.2 }}>From signup to client-ready in under 5 minutes.</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32, maxWidth: 1100, margin: '0 auto' }}>
          {STEPS.map((step, i) => (
            <div key={step.num} className="lp-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
              <span style={{ fontFamily: 'var(--font-instrument-serif, "Instrument Serif", serif)', fontSize: 48, color: 'rgba(15,118,110,0.3)', lineHeight: 1 }}>{step.num}</span>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--lp-text-secondary)', lineHeight: 1.6 }}>{step.desc}</p>
              {/* Arrow between steps on desktop */}
              {i < STEPS.length - 1 && (
                <span className="hidden lg:block" style={{ position: 'absolute', right: -20, top: 40, color: 'var(--lp-text-muted)', fontSize: 18 }}>→</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── 7 · Who it's for ─────────────────────────────────── */}
      <section className="lp-section lp-reveal">
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 64px' }}>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lp-accent)' }}>Who it&apos;s for</span>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 600, marginTop: 16, lineHeight: 1.2 }}>Built for client work.</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
          {AUDIENCES.map((a, i) => (
            <div key={i} className="lp-stagger" style={{ background: 'var(--lp-bg-surface)', border: '1px solid var(--lp-border)', borderRadius: 12, padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 24 }}>{a.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--lp-text)' }}>{a.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--lp-text-secondary)', lineHeight: 1.7 }}>{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 8 · Pricing ──────────────────────────────────────── */}
      <section id="pricing" className="lp-section lp-reveal">
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 24px' }}>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lp-accent)' }}>Pricing</span>
          <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 600, marginTop: 16, lineHeight: 1.2 }}>Simple pricing. No surprises.</h2>
          <p style={{ marginTop: 12, color: 'var(--lp-text-secondary)' }}>Start free. Upgrade when your team grows.</p>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <span style={{ fontSize: 14, color: annual ? 'var(--lp-text-muted)' : 'var(--lp-text)' }}>Monthly</span>
          <button onClick={() => setAnnual((v) => !v)} style={{ width: 48, height: 26, borderRadius: 13, border: '1px solid var(--lp-border)', background: annual ? 'var(--lp-accent)' : 'var(--lp-bg-surface)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
            <span style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: 'white', top: 3, transition: 'left 0.2s', left: annual ? 25 : 3 }} />
          </button>
          <span style={{ fontSize: 14, color: annual ? 'var(--lp-text)' : 'var(--lp-text-muted)' }}>Annual</span>
          {annual && <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(216,239,232,0.9)', color: 'var(--lp-accent)', padding: '3px 10px', borderRadius: 100 }}>Save 20%</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, maxWidth: 1000, margin: '0 auto' }}>
          {/* Free */}
          <PricingCard
            name="Free"
            price="$0"
            period="forever"
            subtitle="For solo freelancers getting started"
            features={['Up to 3 active projects', 'Unlimited team members', 'All channel types (Public, Private, Client)', 'Kanban task boards', 'Client portal (CollabSpace branding)', '1 GB file storage']}
            cta="Start Free"
            ctaStyle="outline"
          />
          {/* Pro — Featured */}
          <PricingCard
            name="Pro"
            price={annual ? '$15' : '$19'}
            period={annual ? 'mo · billed $180/yr' : 'mo'}
            subtitle="For growing freelancers and small teams"
            features={['Everything in Free', 'Unlimited projects', '20 GB file storage', 'Priority support (24h response)', 'Custom workspace name', 'Activity audit log', 'Task due date reminders', 'Advanced task filters']}
            cta="Start Pro Trial"
            ctaStyle="filled"
            featured
            badge="Most Popular"
          />
          {/* Agency */}
          <PricingCard
            name="Agency"
            price={annual ? '$39' : '$49'}
            period={annual ? 'mo · billed $468/yr' : 'mo'}
            subtitle="For agencies managing multiple clients"
            features={['Everything in Pro', 'White-label client portal (your logo + domain)', 'Custom domain support', 'Team analytics & reporting', 'Multiple workspaces', 'SSO / SAML (coming soon)', 'Dedicated onboarding', '100 GB file storage']}
            cta="Start Agency Trial"
            ctaStyle="outline"
          />
        </div>

        <p style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: 'var(--lp-text-muted)' }}>
          All plans include: 14-day full-featured trial · Cancel anytime · Data export always available
        </p>
      </section>

      {/* ─── 9 · FAQ ──────────────────────────────────────────── */}
      <section id="faq" className="lp-section lp-reveal">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--lp-accent)' }}>FAQ</span>
            <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 600, marginTop: 16, lineHeight: 1.2 }}>Common questions.</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} style={{ borderBottom: '1px solid var(--lp-border)' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', background: 'none', border: 'none', color: 'var(--lp-text)', fontSize: 16, fontWeight: 500, textAlign: 'left', cursor: 'pointer', gap: 16, lineHeight: 1.5 }}
                >
                  {item.q}
                  <span className={`lp-faq-icon ${openFaq === i ? 'open' : ''}`}>+</span>
                </button>
                <div className={`lp-faq-answer ${openFaq === i ? 'open' : ''}`}>
                  <p style={{ fontSize: 15, color: 'var(--lp-text-secondary)', lineHeight: 1.7, paddingBottom: 20 }}>{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 10 · Final CTA ───────────────────────────────────── */}
      <section className="lp-grid-bg lp-reveal" style={{ padding: '160px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 72px)', fontFamily: 'var(--font-instrument-serif, "Instrument Serif", serif)', fontStyle: 'italic', fontWeight: 400, lineHeight: 1.1 }}>Start building your first workspace today.</h2>
          <p style={{ marginTop: 20, fontSize: 18, color: 'var(--lp-text-secondary)' }}>Free forever. No credit card. Setup in minutes.</p>
          <Link href="/auth/register" className="lp-cta lp-cta-primary" style={{ padding: '20px 48px', fontSize: 18, marginTop: 40, display: 'inline-flex', borderRadius: 12 }}>Create Your Free Workspace →</Link>
          <div style={{ marginTop: 28, fontSize: 13, color: 'var(--lp-text-muted)' }}>
            Free forever plan · Export your data anytime · No lock-in
          </div>
        </div>
      </section>

      {/* ─── 11 · Footer ──────────────────────────────────────── */}
      <footer style={{ background: 'var(--lp-bg-surface)', borderTop: '1px solid var(--lp-border)', padding: '64px 24px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '40px 32px' }}>
          {/* Logo column */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <LogoMark />
              <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--lp-text)' }}>CollabSpace</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--lp-text-secondary)', lineHeight: 1.6, maxWidth: 200 }}>The unified workspace for freelancers and agencies.</p>
            <p style={{ fontSize: 13, color: 'var(--lp-text-muted)', marginTop: 16 }}>Currently in public beta.</p>
          </div>

          <FooterCol title="Product" links={[
            { label: 'Features', href: '#features' },
            { label: 'How it works', href: '#how-it-works' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'FAQ', href: '#faq' },
          ]} />
          <FooterCol title="Get started" links={[
            { label: 'Create a workspace', href: '/auth/register' },
            { label: 'Sign in', href: '/auth/login' },
          ]} />
          <FooterCol title="Legal" links={[
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
            { label: 'Contact', href: '/contact' },
          ]} />
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', borderTop: '1px solid var(--lp-border)', paddingTop: 24, marginTop: 48, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'var(--lp-text-muted)' }}>
          <span>© 2026 CollabSpace. All rights reserved.</span>
          <span>Made with ♥ for freelancers everywhere</span>
        </div>
      </footer>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Sub-components
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

function LogoMark() {
  return (
    <div style={{ position: 'relative', width: 26, height: 26 }}>
      <div style={{ position: 'absolute', width: 18, height: 18, borderRadius: 5, background: 'var(--lp-accent)', opacity: 0.8, top: 0, left: 0 }} />
      <div style={{ position: 'absolute', width: 18, height: 18, borderRadius: 5, background: 'var(--lp-accent-2)', opacity: 0.8, bottom: 0, right: 0 }} />
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--lp-text-muted)', marginBottom: 16, fontWeight: 600 }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map((l) => (
          <Link key={l.label} href={l.href} style={{ fontSize: 14, color: 'var(--lp-text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Feature Row ──────────────────────────────────────────── */

function FeatureRow({
  imageSide,
  mockup,
  pill,
  title,
  body,
  bullets,
  className,
}: {
  imageSide: 'left' | 'right';
  mockup: React.ReactNode;
  pill: string;
  title: string;
  body: string;
  bullets: string[];
  className?: string;
}) {
  return (
    <div className={className} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 48, alignItems: 'center' }}>
      <div style={{ order: imageSide === 'left' ? 0 : 1 }}>
        {mockup}
      </div>
      <div style={{ order: imageSide === 'left' ? 1 : 0 }}>
        <span className="lp-feature-pill">{pill}</span>
        <h3 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 600, marginTop: 16, lineHeight: 1.25 }}>{title}</h3>
        <p style={{ marginTop: 16, fontSize: 16, color: 'var(--lp-text-secondary)', lineHeight: 1.7 }}>{body}</p>
        <ul style={{ marginTop: 20, listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bullets.map((b) => (
            <li key={b} style={{ display: 'flex', gap: 10, fontSize: 15, color: 'var(--lp-text-secondary)' }}>
              <span style={{ color: 'var(--lp-accent-2)', flexShrink: 0 }}>✓</span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Pricing Card ─────────────────────────────────────────── */

function PricingCard({
  name, price, period, subtitle, features, cta, ctaStyle, featured, badge,
}: {
  name: string; price: string; period: string; subtitle: string; features: string[];
  cta: string; ctaStyle: 'filled' | 'outline'; featured?: boolean; badge?: string;
}) {
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {badge && (
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'var(--lp-accent)', color: 'white', fontSize: 12, fontWeight: 700, padding: '4px 16px', borderRadius: 100, whiteSpace: 'nowrap' }}>{badge}</div>
      )}
      <div className={featured ? 'lp-pricing-featured' : ''} style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--lp-bg-surface)', border: featured ? undefined : '1px solid var(--lp-border)', borderRadius: 12, padding: 32, gap: 24 }}>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 600 }}>{name}</h3>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 42, fontWeight: 700, lineHeight: 1 }}>{price}</span>
            <span style={{ fontSize: 14, color: 'var(--lp-text-secondary)' }}>/ {period}</span>
          </div>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--lp-text-muted)' }}>{subtitle}</p>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {features.map((f) => {
            const grayed = f.includes('coming soon');
            return (
              <li key={f} style={{ display: 'flex', gap: 10, fontSize: 14, color: grayed ? 'var(--lp-text-muted)' : 'var(--lp-text-secondary)' }}>
                <span style={{ color: grayed ? 'var(--lp-text-muted)' : 'var(--lp-accent-2)', flexShrink: 0 }}>✓</span>
                {f}
              </li>
            );
          })}
        </ul>
        <Link
          href="/auth/register"
          className={`lp-cta ${ctaStyle === 'filled' ? 'lp-cta-primary' : 'lp-cta-outline'}`}
          style={{ padding: '14px 24px', fontSize: 15, width: '100%', textAlign: 'center' }}
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Mockup Components (HTML/CSS only)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const S = {
  app: { display: 'flex', minHeight: 360 } as const,
  sidebar: { width: 200, background: 'var(--lp-bg-surface)', borderRight: '1px solid var(--lp-border)', padding: '16px 12px', flexShrink: 0 } as const,
  panel: { flex: 1, padding: 16, overflow: 'hidden', background: 'rgba(255,250,241,0.5)' } as const,
  sideLabel: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--lp-text-muted)', marginBottom: 8 } as const,
  sideItem: (active?: boolean) => ({ padding: '6px 10px', borderRadius: 6, fontSize: 13, color: active ? 'var(--lp-text)' : 'var(--lp-text-secondary)', background: active ? 'rgba(216,239,232,0.8)' : 'transparent', marginBottom: 2, cursor: 'default' }),
  dot: (c: string) => ({ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }),
  av: (bg: string, size = 18) => ({ width: size, height: size, borderRadius: '50%', background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.55, fontWeight: 700, color: 'white', flexShrink: 0 }),
} as const;

function ChromeWrap({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="lp-chrome">
      <div className="lp-chrome-bar">
        <span style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
        </span>
        <span className="lp-chrome-url">{url}</span>
        <span style={{ width: 56 }} />
      </div>
      {children}
    </div>
  );
}

/* ── Hero Browser Mockup (full Kanban) ────────────────────── */

function HeroBrowserMockup() {
  return (
    <ChromeWrap url="app.collabspace.io/workspace/acme-corp">
      <div style={S.app}>
        {/* Sidebar */}
        <div style={S.sidebar} className="hidden md:block">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={S.av('#0f766e', 24)}>A</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--lp-text)' }}>Acme Corp</span>
          </div>
          <p style={S.sideLabel as React.CSSProperties}>Projects</p>
          <div style={S.sideItem(true)}>Website Redesign</div>
          <div style={S.sideItem()}>Mobile App</div>
          <div style={S.sideItem()}>Brand Identity</div>
          <p style={{ ...S.sideLabel as React.CSSProperties, marginTop: 20 }}>Channels</p>
          <div style={S.sideItem()}># general</div>
          <div style={S.sideItem()}># design-review</div>
          <div style={S.sideItem()}>🔒 client-updates</div>
        </div>

        {/* Kanban */}
        <div style={S.panel}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--lp-text)', marginBottom: 16 }}>Website Redesign — Task Board</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <KanbanCol title="To Do" count={3}>
              <MockTask title="Redesign homepage hero section" assignee="MJ" prio="#ef4444" due="Mar 28" />
              <MockTask title="Mobile responsive breakpoints" assignee="AL" prio="#f59e0b" due="Apr 2" />
              <MockTask title="SEO meta tags implementation" prio="#666" />
            </KanbanCol>
            <KanbanCol title="In Progress" count={2} highlight>
              <MockTask title="Navigation component" assignee="MJ" prio="#ef4444" due="Mar 26" progress={60} />
              <MockTask title="Design system tokens" assignee="PR" prio="#f59e0b" progress={85} />
            </KanbanCol>
            <KanbanCol title="Done" count={2}>
              <MockTask title="Project kick-off meeting" done />
              <MockTask title="Wireframes v1 approved" done />
            </KanbanCol>
          </div>
        </div>
      </div>
    </ChromeWrap>
  );
}

function KanbanCol({ title, count, highlight, children }: { title: string; count: number; highlight?: boolean; children: React.ReactNode }) {
  return (
      <div style={{ background: highlight ? 'rgba(216,239,232,0.5)' : 'transparent', borderRadius: 8, padding: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lp-text-secondary)' }}>{title}</span>
        <span style={{ fontSize: 11, color: 'var(--lp-text-muted)' }}>{count}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

function MockTask({ title, assignee, prio, due, progress, done }: { title: string; assignee?: string; prio?: string; due?: string; progress?: number; done?: boolean }) {
  return (
    <div className="lp-task-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {prio && <span style={S.dot(prio)} />}
        {done && <span style={{ color: '#28C840', fontSize: 12 }}>✓</span>}
        <span style={{ fontSize: 12, color: done ? 'var(--lp-text-muted)' : 'var(--lp-text)', textDecoration: done ? 'line-through' : 'none', lineHeight: 1.3 }}>{title}</span>
      </div>
      {(assignee || due || progress != null) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          {assignee && <span style={S.av('#0f766e', 16)}>{assignee}</span>}
          {due && <span style={{ fontSize: 10, color: 'var(--lp-text-muted)' }}>{due}</span>}
          {progress != null && (
            <div style={{ flex: 1, height: 3, background: 'var(--lp-border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--lp-accent)', borderRadius: 2 }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Channel Mockup ───────────────────────────────────────── */

function ChannelMockup() {
  return (
    <ChromeWrap url="app.collabspace.io/channels/client-updates">
      <div style={S.app}>
        <div style={{ ...S.sidebar, width: 160 }} className="hidden sm:block">
          <p style={S.sideLabel as React.CSSProperties}>Channels</p>
          <div style={S.sideItem()}># general</div>
          <div style={S.sideItem()}># dev-updates</div>
          <div style={S.sideItem(true)}>🔒 client-updates</div>
        </div>
        <div style={S.panel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--lp-border)' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--lp-text)' }}># client-updates</span>
            <span style={{ fontSize: 10, background: 'rgba(216,239,232,0.9)', color: 'var(--lp-accent)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>Client-visible</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ChatMsg av="MJ" bg="#0f766e" name="Marcus" time="2:34 PM">Hey Sarah, the homepage design is ready for review!</ChatMsg>
            <ChatMsg av="SC" bg="#b7791f" name="Sarah Chen" time="2:41 PM" badge="via client portal">This looks fantastic! Love the new hero section. Can we adjust the button colors to match our brand guidelines?</ChatMsg>
            <ChatMsg av="MJ" bg="#0f766e" name="Marcus" time="2:43 PM">On it! Will update and share a new version by tomorrow morning.</ChatMsg>
          </div>
          <div style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(240,227,207,0.4)', borderRadius: 8, border: '1px solid var(--lp-border)', fontSize: 12, color: 'var(--lp-text-muted)' }}>Type a message…</div>
        </div>
      </div>
    </ChromeWrap>
  );
}

function ChatMsg({ av, bg, name, time, badge, children }: { av: string; bg: string; name: string; time: string; badge?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div style={S.av(bg, 28)}>{av}</div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--lp-text)' }}>{name}</span>
          <span style={{ fontSize: 10, color: 'var(--lp-text-muted)' }}>{time}</span>
          {badge && <span style={{ fontSize: 9, background: 'rgba(183,121,31,0.15)', color: 'var(--lp-accent-2)', padding: '1px 6px', borderRadius: 3 }}>{badge}</span>}
        </div>
        <p style={{ fontSize: 13, color: 'var(--lp-text-secondary)', lineHeight: 1.5, marginTop: 4 }}>{children}</p>
      </div>
    </div>
  );
}

/* ── Kanban Detail Mockup ─────────────────────────────────── */

function KanbanMockup() {
  return (
    <ChromeWrap url="app.collabspace.io/board/website-redesign">
      <div style={{ ...S.app, minHeight: 320 }}>
        {/* Mini board columns */}
        <div style={{ width: '50%', padding: 12, borderRight: '1px solid var(--lp-border)', display: 'flex', gap: 8 }} className="hidden sm:flex">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--lp-text-muted)', marginBottom: 8 }}>To Do</div>
            <div className="lp-task-card" style={{ marginBottom: 6 }}><span style={{ fontSize: 11, color: 'var(--lp-text-secondary)' }}>Redesign hero</span></div>
            <div className="lp-task-card"><span style={{ fontSize: 11, color: 'var(--lp-text-secondary)' }}>Mobile responsive</span></div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--lp-text-muted)', marginBottom: 8 }}>In Progress</div>
            <div className="lp-task-card" style={{ border: '1px solid rgba(15,118,110,0.3)' }}><span style={{ fontSize: 11, color: 'var(--lp-accent)' }}>Navigation ◀</span></div>
          </div>
        </div>

        {/* Task detail slide-in */}
        <div style={{ flex: 1, padding: 16, background: 'rgba(240,227,207,0.3)', borderLeft: '1px solid var(--lp-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--lp-text)' }}>Redesign homepage hero section</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16, fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={S.av('#0f766e', 18)}>MJ</span><span style={{ color: 'var(--lp-text-secondary)' }}>Marcus J.</span></div>
            <span style={{ color: 'var(--lp-text-muted)' }}>Due: Mar 28, 2026</span>
            <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '1px 8px', borderRadius: 4, fontWeight: 600, fontSize: 11 }}>High</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--lp-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>Update the hero to use the new brand photography. Ensure it&apos;s responsive across all breakpoints.</p>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--lp-text-muted)', marginBottom: 8 }}>Comments</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={S.av('#0f766e', 20)}>MJ</div>
                <p style={{ fontSize: 12, color: 'var(--lp-text-secondary)' }}>Started working on the Figma mockup</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={S.av('#8b5cf6', 20)}>PR</div>
                <p style={{ fontSize: 12, color: 'var(--lp-text-secondary)' }}>Looks great, awaiting client approval</p>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--lp-text-muted)' }}>Attachments</span>
            <span style={{ fontSize: 11, background: 'var(--lp-bg-surface)', border: '1px solid var(--lp-border)', padding: '3px 10px', borderRadius: 6, color: 'var(--lp-text-secondary)' }}>📎 hero-mockup-v2.fig</span>
          </div>
        </div>
      </div>
    </ChromeWrap>
  );
}

/* ── Client Portal Mockup ─────────────────────────────────── */

function PortalMockup() {
  return (
    <div className="lp-chrome" style={{ background: '#fffaf1' }}>
      {/* Branding bar */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--lp-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(240,227,207,0.5)' }}>
        <span style={{ fontSize: 11, color: 'var(--lp-text-muted)' }}>Powered by CollabSpace · Acme Corp</span>
          <span style={{ fontSize: 10, background: 'rgba(216,239,232,0.9)', color: 'var(--lp-accent)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>Client View</span>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={S.av('#b7791f', 32)}>AC</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--lp-text)' }}>Website Redesign</p>
            <p style={{ fontSize: 11, color: 'var(--lp-text-muted)' }}>Project Update</p>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--lp-text-secondary)', marginBottom: 6 }}>
            <span>Progress</span><span>62% — 6 of 14 tasks</span>
          </div>
          <div style={{ height: 6, background: 'var(--lp-bg-surface)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: '62%', height: '100%', background: 'var(--lp-accent)', borderRadius: 3 }} />
          </div>
        </div>

        {/* Activity */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--lp-text-muted)', marginBottom: 10 }}>This week</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--lp-text-secondary)' }}>
              <span style={{ color: '#28C840' }}>✓</span> Navigation component — completed by Marcus
            </div>
            <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--lp-text-secondary)' }}>
              <span style={{ color: 'var(--lp-accent)' }}>→</span> Homepage hero — In Progress, due March 28
            </div>
          </div>
        </div>

        {/* Files */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--lp-text-muted)', marginBottom: 10 }}>Shared files</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 11, background: 'var(--lp-bg-surface)', border: '1px solid var(--lp-border)', padding: '4px 10px', borderRadius: 6, color: 'var(--lp-text-secondary)' }}>📄 wireframes-v3.pdf</span>
            <span style={{ fontSize: 11, background: 'var(--lp-bg-surface)', border: '1px solid var(--lp-border)', padding: '4px 10px', borderRadius: 6, color: 'var(--lp-text-secondary)' }}>📄 brand-guidelines.pdf</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Chaos Map (Problem section) ──────────────────────────── */

function ChaosMap() {
  const apps = [
    { name: 'Slack', color: '#E01E5A', x: 10, y: 10 },
    { name: 'Trello', color: '#0079BF', x: 65, y: 5 },
    { name: 'Gmail', color: '#EA4335', x: 85, y: 35 },
    { name: 'Google Drive', color: '#0F9D58', x: 60, y: 55 },
    { name: 'Notion', color: '#999', x: 5, y: 50 },
    { name: 'Zoom', color: '#2D8CFF', x: 35, y: 30 },
  ];

  return (
    <div style={{ marginTop: 48, position: 'relative' }}>
      <svg viewBox="0 0 400 230" width="100%" style={{ maxWidth: 600, margin: '0 auto', display: 'block', overflow: 'visible' }}>
        {/* Chaos lines */}
        <path d="M80 40 C 150 10, 200 80, 280 30" stroke="var(--lp-text-muted)" fill="none" strokeWidth="1" opacity="0.4" />
        <path d="M280 30 C 330 50, 350 90, 350 80" stroke="var(--lp-text-muted)" fill="none" strokeWidth="1" opacity="0.4" />
        <path d="M350 80 C 320 110, 270 130, 260 120" stroke="var(--lp-text-muted)" fill="none" strokeWidth="1" opacity="0.4" />
        <path d="M260 120 C 200 140, 100 100, 50 110" stroke="var(--lp-text-muted)" fill="none" strokeWidth="1" opacity="0.4" />
        <path d="M50 110 C 80 80, 120 60, 160 75" stroke="var(--lp-text-muted)" fill="none" strokeWidth="1" opacity="0.4" />
        <path d="M80 40 C 60 70, 30 100, 50 110" stroke="var(--lp-text-muted)" fill="none" strokeWidth="1" opacity="0.3" />
        <path d="M160 75 C 210 60, 240 40, 280 30" stroke="var(--lp-text-muted)" fill="none" strokeWidth="1" opacity="0.3" />
        <path d="M160 75 C 200 100, 300 100, 350 80" stroke="var(--lp-text-muted)" fill="none" strokeWidth="1" opacity="0.3" />

        {/* App pills */}
        {apps.map((app) => {
          const cx = (app.x / 100) * 400;
          const cy = (app.y / 100) * 140 + 15;
          return (
            <g key={app.name}>
              <rect x={cx - 40} y={cy - 12} width={80} height={24} rx={12} fill="var(--lp-bg-elevated)" stroke="var(--lp-border)" />
              <circle cx={cx - 26} cy={cy} r={3} fill={app.color} />
              <text x={cx - 18} y={cy + 4} fontSize="10" fill="var(--lp-text-secondary)">{app.name}</text>
            </g>
          );
        })}

        {/* Arrow down to solution */}
        <line x1="200" y1="160" x2="200" y2="185" stroke="var(--lp-text-muted)" strokeWidth="1.5" markerEnd="url(#arrowhead)" />
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="var(--lp-text-muted)" />
          </marker>
        </defs>

        {/* Solution pill */}
        <rect x="150" y="188" width="100" height="28" rx="14" fill="var(--lp-accent)" />
        <text x="200" y="206" fontSize="11" fill="white" textAnchor="middle" fontWeight="600">One workspace</text>
      </svg>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Data Constants
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const STEPS = [
  { num: '01', title: 'Create your workspace', desc: 'Sign up free. Name your workspace. Done. No credit card, no onboarding call, no 47-step setup wizard.' },
  { num: '02', title: 'Add your project and team', desc: 'Create a project for each client engagement. Invite your team members in one click. Channels and a task board are created automatically.' },
  { num: '03', title: 'Invite your client', desc: 'Send your client a magic link. They get their own branded portal with just their project\'s information — no account creation needed on their end.' },
  { num: '04', title: 'Collaborate and ship', desc: 'Your team works in channels and tasks. Your client stays updated. Everyone knows what\'s happening. Projects actually finish on time.' },
];

const AUDIENCES = [
  {
    icon: '👩‍💻',
    title: 'Freelancers',
    desc: 'Run every client engagement in its own workspace. Stop rewriting the same status update — send a portal link instead.',
  },
  {
    icon: '🏢',
    title: 'Small agencies',
    desc: 'Keep internal discussion separate from what the client sees. Onboard a new contributor without a three-day context dump.',
  },
  {
    icon: '🤝',
    title: 'Their clients',
    desc: 'A read-only portal with progress, files, and a channel to reach the team — no account to create, no password to remember.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Is CollabSpace really free? What\'s the catch?',
    a: 'Yes, genuinely free — forever. The Free plan supports 3 active projects with all core features: channels, kanban boards, client portal, and file sharing. We make money when teams grow and need more projects or storage. No trials, no credit card required, no bait-and-switch.',
  },
  {
    q: 'How does the client portal work exactly?',
    a: 'When you invite a client to a project, they get a magic link via email. Clicking it takes them straight to their project portal — no account creation, no password. They see only what you\'ve designated as client-visible: CLIENT channels, task progress (read-only), shared files, and the project dashboard. They can send messages in client channels. They never see your internal channels, private notes, or team discussions.',
  },
  {
    q: 'Can I migrate from Trello / Slack?',
    a: 'For Trello, export your board as CSV and upload it in project settings — each list becomes a board list and each card becomes a task, with labels and due dates preserved. A Slack message-history importer is still on our roadmap. Most teams run CollabSpace alongside their current tools for a week or two while they switch over, and you can always export everything back out.',
  },
  {
    q: 'What happens if I exceed the Free plan limits?',
    a: 'We\'ll notify you via email and in-app when you approach your 3-project limit. Your existing projects and data are never deleted or locked. You\'ll need to upgrade or archive a project to create new ones. No surprises, no automatic charges.',
  },
  {
    q: 'Is my data secure? Can I export it?',
    a: 'Data is encrypted in transit (HTTPS/TLS) and at rest by our database provider. Passwords are hashed with bcrypt, and client portal links use expiring session tokens. You can export all your workspace data — projects, tasks, conversations, and files — as a ZIP archive at any time from workspace settings, no support ticket required. We don\'t hold your data hostage. We\'re a small team in public beta, so we don\'t yet hold formal certifications like SOC 2.',
  },
  {
    q: 'Do clients need a CollabSpace account?',
    a: 'No. Clients access their portal via a magic link — no account, no password, no app to download. The link can be regenerated at any time from project settings. On the Agency plan, the portal is white-labeled with your branding, so clients never even see the CollabSpace name.',
  },
];
