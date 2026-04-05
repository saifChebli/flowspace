Build a complete, production-ready marketing landing page view inside the client next project for "CollabSpace" — a SaaS platform 
for freelancers and small agencies that replaces Slack + Trello + client email with a single 
unified workspace. The product is fully built and live — this is a conversion-focused landing 
page, not a "coming soon" page.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCT CONTEXT (read all of this before writing a single line of code)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Product name: CollabSpace
Tagline: "One workspace. Every project. Zero chaos."
Sub-tagline: "Real-time messaging, Kanban task boards, and a client portal — 
              built for freelancers and small agencies."

Three user types:
  - Admin (freelancer / agency owner) — creates workspace, manages team
  - Member (team member) — works on tasks, communicates in channels
  - Client — read-only portal with controlled visibility

Core features (all shipped, all live):
  1. Slack-style Channels — PUBLIC (team), PRIVATE, CLIENT-visible per project
  2. Kanban Task Boards — drag-and-drop, lists, assignees, due dates, priorities
  3. Client Portal — branded, magic-link access, clients see their project status 
                     without internal noise
  4. Project Dashboard — progress metrics, activity feed, team overview
  5. File Sharing — upload to tasks and channels, 25MB per file, S3-backed
  6. In-app Notifications — task assigned, @mentions, status changes

What it replaces:
  Slack + Trello + Email threads + Google Drive links = CollabSpace

Pricing (3 tiers):
  - Free: up to 3 projects, core features, 1 GB storage
  - Pro: $19/month — unlimited projects, file storage 20 GB, priority support
  - Agency: $49/month — unlimited everything, white-label client portal, 
            custom domain, team analytics

Target audience: freelancers, remote teams 2–10 people, small creative/dev agencies

CTA goal: Drive signups to the free tier. Primary CTA = "Start Free — No credit card"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN DIRECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Aesthetic: Dark-first, editorial, premium-technical. Think Linear.app meets Notion.
           Not a purple-gradient startup cliché. Sophisticated and focused.
 
 colors : use colors that already defined on the client project
  
  Scale:
    Hero h1: 72px desktop / 42px mobile, Instrument Serif, font-weight 400 (italic)
    Section h2: 42px desktop / 28px mobile, DM Sans, font-weight 600
    Card h3: 20px, DM Sans, font-weight 600
    Body: 17px, DM Sans, line-height 1.7
    Small/caption: 13px

Motion philosophy:
  - One orchestrated page load: navbar fades in (0ms), hero text slides up (150ms), 
    hero mockup fades in (400ms), hero badges appear (600ms)
  - Scroll-triggered: sections fade up with translateY(24px → 0) as they enter viewport
    Use IntersectionObserver with threshold 0.15
  - Hover states: cards lift slightly (translateY -2px, border brightens), 
    CTA buttons pulse their glow on hover
  - NO autoplay animations, no parallax, no scroll-jacking

Layout rules:
  - Max content width: 1200px, centered
  - Section padding: 120px vertical desktop, 80px mobile
  - Use CSS Grid throughout (no flexbox-only columns)
  - All sections alternate between centered content and asymmetric layouts
  - Mobile breakpoint: 768px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — NAVIGATION (sticky)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Position: sticky top-0, z-index 100
Background: rgba(10,10,15,0.85) with backdrop-filter: blur(16px)
Border-bottom: 1px solid var(--border)
Height: 64px

Left: Logo — a small geometric mark (CSS-drawn: two overlapping rounded squares, 
      one in --accent, one in --accent-2) + "CollabSpace" wordmark in DM Sans 600

Center: Navigation links — Features | How it Works | Pricing | Changelog
        Desktop only. Font-size 14px, color var(--text-secondary).
        Hover: color transitions to var(--text-primary)
        Active section: underline in --accent (2px, 4px below text)

Right: 
  "Log in" link (text only, --text-secondary)
  "Start Free" button — filled, background var(--accent), text white, 
    border-radius 8px, padding 10px 20px, font-weight 600, font-size 14px
    Hover: brightness(1.1) + subtle glow: box-shadow 0 0 20px var(--accent-glow)

Mobile: hamburger menu (3 lines → X animation). Opens full-screen overlay 
        with all nav links stacked, large font-size 28px. Close on link click.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — HERO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Background: var(--bg) with a subtle radial gradient centered behind the headline:
  radial-gradient(ellipse 60% 50% at 50% 0%, rgba(91,141,239,0.08) 0%, transparent 70%)
  DO NOT make this gradient visible as a colored blob — it should be a barely-perceptible
  atmospheric glow, not a colorful spotlight.

Layout: Centered column, max-width 820px

Top badge (appears before headline):
  Pill badge — background: rgba(91,141,239,0.1), border: 1px solid rgba(91,141,239,0.3)
  Text: "✦ Now in public beta — free forever plan available"
  Font-size 13px, color var(--accent), border-radius 100px, padding 6px 16px
  Small pulsing dot (CSS animation, 2s ease-in-out infinite) before the text

Headline (h1):
  Line 1: "One workspace for" — DM Sans 600, var(--text-primary)  
  Line 2: "every project." — Instrument Serif italic, var(--text-primary)
  Line 3: "Zero chaos." — DM Sans 600, var(--accent)
  
  The deliberate serif/sans mix on lines 1–2 creates the memorable visual moment.
  Line 3 is slightly smaller (52px) and in accent color.

Sub-headline:
  "Stop juggling Slack, Trello, and email threads. CollabSpace gives your team 
   and clients one shared workspace — with real-time channels, task boards, 
   and a beautiful client portal."
  Font-size 18px, var(--text-secondary), max-width 600px, centered, line-height 1.7

CTA group (below sub-headline, 40px gap from it):
  Primary: "Start Free — No credit card" button
    Background: var(--accent), color white, border-radius 10px
    Padding: 16px 32px, font-size 16px, font-weight 600
    Hover: scale(1.02) + glow
  Secondary: "See a live demo →" text link
    Color var(--text-secondary), underline on hover
  
  Below buttons (24px gap): 
    Row of 3 micro-trust signals, each with a small checkmark icon (✓ in --accent-2):
    "Free forever plan"   "No credit card needed"   "Setup in 2 minutes"

Social proof numbers (below trust signals, 48px gap):
  Row of 3 stats with large numbers:
    "2,400+" — Active workspaces
    "18,000+" — Tasks completed
    "4.9★" — Average rating
  Numbers in var(--text-primary) at 28px DM Sans 700
  Labels in var(--text-secondary) at 13px

HERO PRODUCT MOCKUP:
  This is the most important visual on the page. Build it entirely in HTML/CSS.
  It should look like a realistic dark-mode app screenshot at ~70% scale.
  
  Outer: browser chrome frame
    - Rounded rectangle, background var(--bg-elevated), border var(--border)
    - Top bar: 3 traffic light dots (red #FF5F57, yellow #FEBC2E, green #28C840)
              + fake URL bar centered: "app.collabspace.io/workspace/acme-corp"
  
  Inner: app interface split into two panels:
  
  LEFT PANEL (sidebar, 220px wide, --bg-surface background):
    Workspace name "Acme Corp" at top with avatar
    Section "Projects":
      - "Website Redesign" (active, highlighted in --accent-glow)
      - "Mobile App"
      - "Brand Identity"
    Section "Channels" with small icons:
      - # general
      - # design-review
      - 🔒 client-updates (CLIENT channel indicator)
    Bottom: user avatar row
  
  RIGHT PANEL: shows the Kanban board
    Title "Website Redesign — Task Board"
    3 columns side by side:
    
    Column "To Do" (3 task cards):
      Task 1: "Redesign homepage hero section"
              Assignee avatar (colored circle initials "MJ"), Priority: High (red dot)
              Due: "Mar 28"
      Task 2: "Mobile responsive breakpoints"
              Assignee "AL", Priority: Medium (amber dot), Due: "Apr 2"
      Task 3: "SEO meta tags implementation"
              No assignee, Priority: Low (gray dot)
    
    Column "In Progress" (2 task cards, slightly highlighted column):
      Task 1: "Navigation component" — Assignee "MJ", HIGH priority, progress bar 60%
      Task 2: "Design system tokens" — Assignee "PR", MEDIUM priority, progress 85%
    
    Column "Done" (2 task cards, slightly muted):
      Task 1: "Project kick-off meeting" — strikethrough style, green checkmark
      Task 2: "Wireframes v1 approved" — strikethrough, green checkmark
    
    Each task card:
      - background var(--bg-elevated), border var(--border)
      - border-radius 8px, padding 12px
      - Priority dot (3px circle) + title + assignee avatar (18px circle) + due date
      - Font sizes: title 13px, meta 11px

  Below the browser frame: subtle reflection effect using CSS gradient
  (a very faint upside-down copy at 10% opacity, blurred, no more than 40px tall)
  This adds depth without gimmickry.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — LOGO BAR (Social Proof Companies)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Background: var(--bg-surface)
Border-top + border-bottom: 1px solid var(--border)
Padding: 40px 0

Label above logos: "Trusted by freelancers and agencies at" 
                   font-size 13px, var(--text-muted), text-align center, 
                   text-transform uppercase, letter-spacing 0.1em

Logo row: 6 company names as text logos (since this is a demo, render as styled text):
  "Pixel Studio"  "Forge Agency"  "Nomad Labs"  "Crestline Co."  
  "Wavefront"  "Arclight Studio"
  
  Styling: DM Sans 600, font-size 15px, color var(--text-muted)
  Justify-content: space-evenly, align-items center
  On mobile: 3 per row, 2 rows

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — THE PROBLEM (before the solution)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This section creates emotional resonance before pitching the product.
Layout: Centered, max-width 720px

Eyebrow label: "The Problem"
  Font-size 12px, font-weight 600, letter-spacing 0.12em, text-transform uppercase
  Color var(--accent), margin-bottom 16px

Headline: "You're running your project across 6 apps."
  h2, DM Sans 600

Body paragraph:
  "Slack for messages. Trello for tasks. Email for client updates. Google Drive 
   for files. Notion for docs. And a calendar app to keep track of all of it. 
   Every tool is a context switch. Every switch is lost momentum. And your 
   clients still don't know what's happening."

Visual: A horizontal "chaos map" — rendered in HTML/CSS
  Show 6 app pills connected by curved arrows that cross each other chaotically.
  Pills: Slack | Trello | Gmail | Google Drive | Notion | Zoom
  Each pill: dark rounded badge (var(--bg-elevated), var(--border))
             with a colored dot representing the app's brand color
  Arrows: thin (1px) lines in var(--text-muted), curved SVG paths
  The visual effect should feel messy and overwhelming — arrows intersecting,
  pills scattered in a non-linear arrangement (not a neat row)
  
  Below the chaos map → a single arrow pointing down → CollabSpace pill 
  (var(--accent) background, white text) labeled "One workspace"
  The visual storytelling: many tools → one solution

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5 — FEATURES (the solution, 3 main pillars)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Eyebrow: "Features"
Section headline: "Everything your project needs. Nothing it doesn't."
Layout: 3 alternating full-width feature rows (image left / text right, then flip)

━━ FEATURE ROW 1 — Channels (left: mockup, right: text) ━━

Text side:
  Feature label pill: "Messaging" — small pill, var(--accent) color scheme
  Headline: "Real-time channels, not endless email threads"
  Body: "Every project gets its own set of channels. Keep team conversations 
         in Public channels, sensitive discussions in Private ones, and use 
         Client channels so your clients stay in the loop — without seeing 
         your internal chaos."
  Feature bullets (3 items, each with a small SVG checkmark in --accent-2):
    ✓ "Public, Private, and Client-visible channels per project"
    ✓ "@mentions that actually notify people"
    ✓ "File attachments up to 25 MB, right in the conversation"

Mockup side (HTML/CSS, not an image):
  A messaging interface panel:
    Left sidebar: channel list — # general, # dev-updates, 🔒 client-updates (highlighted)
    Right: message thread for "# client-updates"
    Messages:
      "Marcus" (avatar MJ): "Hey Sarah, the homepage design is ready for review!"
                             Timestamp: "2:34 PM"
      "Sarah Chen" (avatar SC, DIFFERENT color — client marker):
        "This looks fantastic! Love the new hero section. Can we adjust 
         the button colors to match our brand guidelines?"
        "2:41 PM · via client portal"
      "Marcus": "On it! Will update and share a new version by tomorrow morning."
    
    Bottom: message input bar (styled, not functional)
    Visual indicator: "🔒 Client-visible channel" badge at top of the thread

━━ FEATURE ROW 2 — Kanban (right: mockup, left: text) ━━

Text side:
  Feature label pill: "Task Management"
  Headline: "Kanban boards without the complexity"
  Body: "Create task boards for each project. Drag tasks between columns as work 
         progresses. Assign team members, set due dates, mark priorities — and 
         let your clients see exactly where everything stands."
  Feature bullets:
    ✓ "Drag-and-drop between To Do, In Progress, Review, Done"
    ✓ "Assignees, due dates, priorities, and file attachments per task"
    ✓ "Clients get a read-only view — no accidental edits"

Mockup side:
  A compressed version of the Kanban board from the hero — 
  but this time show a TASK DETAIL panel open (slide-in from right):
    Task: "Redesign homepage hero section"
    Assignee: Marcus J.
    Due: March 28, 2026
    Priority: High (red badge)
    Description: "Update the hero to use the new brand photography. 
                  Ensure it's responsive across all breakpoints."
    Comment thread (2 comments):
      "MJ: Started working on the Figma mockup"
      "PR: Looks great, awaiting client approval"
    Attachments: "hero-mockup-v2.fig" (file pill)

━━ FEATURE ROW 3 — Client Portal (left: mockup, right: text) ━━

Text side:
  Feature label pill: "Client Portal"
  Headline: "Clients stay informed. Without the email chains."
  Body: "Every project comes with a branded client portal. Send your client 
         a magic link — they get a clean, professional view of their project's 
         progress, active tasks, and shared files. No account creation. 
         No internal noise. Just what they need to see."
  Feature bullets:
    ✓ "Branded with your agency logo and colors"
    ✓ "Magic-link access — no password required for clients"
    ✓ "Clients see progress, milestones, CLIENT channels, and files only"

Mockup side:
  Show a CLIENT PORTAL view (different visual treatment — lighter-feeling, 
  as if it's a different app or a public-facing page):
    Top: "Powered by CollabSpace · Acme Corp" branding bar
    Agency logo placeholder + "Project Update — Website Redesign" heading
    
    Progress section:
      Progress bar at 62% with "6 of 14 tasks completed"
    
    "What's happening this week" section:
      2 activity items with icons:
        ✓ "Navigation component — completed by Marcus"
        → "Homepage hero — In Progress, due March 28"
    
    "Recent messages" section:
      Shows the client-updates channel excerpt
    
    "Files shared with you" section:
      2 file pills: "wireframes-v3.pdf" and "brand-guidelines.pdf"
    
    Visual note: this mockup has a slightly lighter background (#16161F)
    and a "Client View" badge in the corner to distinguish it from the team view

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6 — HOW IT WORKS (numbered steps)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Eyebrow: "How it works"
Headline: "From signup to client-ready in under 5 minutes."

Layout: 4 steps in a horizontal row on desktop, vertical stack on mobile
Each step:
  - Large step number (01, 02, 03, 04) in Instrument Serif, 48px, 
    color rgba(91,141,239,0.3) — large and decorative, not dominant
  - Icon: small CSS-drawn icon (16px) in --accent
  - Title: DM Sans 600, 18px
  - Description: 14px, var(--text-secondary), 2–3 lines max

Steps:
  01 — "Create your workspace"
       "Sign up free. Name your workspace. Done. No credit card, 
        no onboarding call, no 47-step setup wizard."
  
  02 — "Add your project and team"
       "Create a project for each client engagement. Invite your 
        team members in one click. Channels and a task board are 
        created automatically."
  
  03 — "Invite your client"
       "Send your client a magic link. They get their own branded 
        portal with just their project's information — no account 
        creation needed on their end."
  
  04 — "Collaborate and ship"
       "Your team works in channels and tasks. Your client stays 
        updated. Everyone knows what's happening. Projects actually 
        finish on time."

Between each step on desktop: a small right-arrow (→) in var(--text-muted)
On mobile: a down-arrow (↓) between steps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7 — SOCIAL PROOF / TESTIMONIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Eyebrow: "What people are saying"
Headline: "Freelancers and agencies love it."

Layout: 3-column grid on desktop, 1-column on mobile
Testimonial cards:
  Background var(--bg-surface), border var(--border), border-radius 12px
  Padding 28px

Card 1:
  Stars: ★★★★★ in --accent
  Quote: "We used to spend the first 15 minutes of every client call explaining 
          where things stood. Now we just send them the portal link. Game changer."
  Author: "Alex Mercer" — "Freelance Developer, 7 years"
  Avatar: Initials "AM" in a circle, --accent background

Card 2 (center card — slightly elevated, border in --accent at 30% opacity):
  Stars: ★★★★★
  Quote: "CollabSpace replaced Slack, Trello, AND our client reporting email. 
          That's three subscriptions cancelled in one week. Our clients are 
          actually responding faster now because everything is in one place."
  Author: "Priya Nair" — "Founder, Inkwell Agency (8 people)"
  Avatar: Initials "PN", --accent-2 background
  Small badge: "Most Popular for agencies"

Card 3:
  Stars: ★★★★★
  Quote: "As a client, I always felt like I was interrupting when I asked for 
          updates. Now I just check the portal. I love being able to see 
          task progress without bothering the team."
  Author: "Carlos Vega" — "Product Manager, Startup Client"
  Avatar: Initials "CV", coral-toned background (#3A1F1F)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8 — PRICING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Eyebrow: "Pricing"
Headline: "Simple pricing. No surprises."
Sub-headline: "Start free. Upgrade when your team grows."

Toggle: Monthly / Annual (annual saves 20%)
  Implement as a real toggle switch. When "Annual" is selected, prices update:
  Free stays free, Pro changes to $15/mo (billed $180/yr), 
  Agency changes to $39/mo (billed $468/yr)
  Small "Save 20%" badge appears next to "Annual" option when selected

Layout: 3 pricing cards side by side, centered

Card: FREE
  Price: $0 / forever
  Subtitle: "For solo freelancers getting started"
  Feature list (6 items, ✓ checkmarks in --accent-2):
    ✓ Up to 3 active projects
    ✓ Unlimited team members
    ✓ All channel types (Public, Private, Client)
    ✓ Kanban task boards
    ✓ Client portal (CollabSpace branding)
    ✓ 1 GB file storage
  CTA button: "Start Free" — outlined style (border: 1px solid var(--border-hover))

Card: PRO — FEATURED (this card gets special treatment)
  Badge above card: "Most Popular" — small pill, --accent background
  Card gets: border 1px solid rgba(91,141,239,0.4), 
             background with very subtle glow: 
             background: linear-gradient(135deg, var(--bg-elevated) 0%, 
                         rgba(91,141,239,0.05) 100%)
  Price: $19/mo (Monthly) or $15/mo (Annual)
  Subtitle: "For growing freelancers and small teams"
  Feature list (8 items):
    ✓ Everything in Free
    ✓ Unlimited projects
    ✓ 20 GB file storage
    ✓ Priority support (24h response)
    ✓ Custom workspace name
    ✓ Activity audit log
    ✓ Task due date reminders
    ✓ Advanced task filters
  CTA button: Filled --accent button "Start Pro Trial"

Card: AGENCY
  Price: $49/mo (Monthly) or $39/mo (Annual)
  Subtitle: "For agencies managing multiple clients"
  Feature list (8 items):
    ✓ Everything in Pro
    ✓ White-label client portal (your logo + domain)
    ✓ Custom domain support
    ✓ Team analytics & reporting
    ✓ Multiple workspaces
    ✓ SSO / SAML (coming soon — grayed out)
    ✓ Dedicated onboarding
    ✓ 100 GB file storage
  CTA button: Outlined "Start Agency Trial"

Below pricing cards:
  "All plans include: 14-day full-featured trial · Cancel anytime · 
   GDPR compliant · Data export always available"
  Font-size 13px, var(--text-muted), centered

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 9 — FAQ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Eyebrow: "FAQ"
Headline: "Common questions."
Layout: Single column, max-width 720px, centered

Implement as an accordion — clicking a question expands its answer with a 
smooth CSS height transition (max-height 0 → auto via JS). 
"+" icon rotates to "×" when open. 
Only one question open at a time.

Questions and answers:

Q: "Is CollabSpace really free? What's the catch?"
A: "Yes, genuinely free — forever. The Free plan supports 3 active projects 
    with all core features: channels, kanban boards, client portal, and file 
    sharing. We make money when teams grow and need more projects or storage. 
    No trials, no credit card required, no bait-and-switch."

Q: "How does the client portal work exactly?"
A: "When you invite a client to a project, they get a magic link via email. 
    Clicking it takes them straight to their project portal — no account creation, 
    no password. They see only what you've designated as client-visible: 
    CLIENT channels, task progress (read-only), shared files, and the project 
    dashboard. They can send messages in client channels. They never see your 
    internal channels, private notes, or team discussions."

Q: "Can I migrate from Trello / Slack?"
A: "We support CSV import for tasks (Trello-compatible format). For Slack, 
    you can export your message history and we'll provide an import tool. 
    Most teams run CollabSpace alongside their current tools for 1–2 weeks 
    during migration. Our onboarding guide walks you through the full process."

Q: "What happens if I exceed the Free plan limits?"
A: "We'll notify you via email and in-app when you approach your 3-project 
    limit. Your existing projects and data are never deleted or locked. You'll 
    need to upgrade or archive a project to create new ones. No surprises, 
    no automatic charges."

Q: "Is my data secure? Can I export it?"
A: "Data is encrypted at rest (AES-256) and in transit (TLS 1.3). We're 
    GDPR compliant with EU data processing agreements available. You can export 
    all your workspace data (projects, messages, tasks, files) as a JSON archive 
    at any time from Settings — no support ticket required. We don't hold your 
    data hostage."

Q: "Do clients need a CollabSpace account?"
A: "No. Clients access their portal via a magic link — no account, no password, 
    no app to download. The link can be regenerated at any time from project 
    settings. On the Agency plan, the portal is white-labeled with your branding, 
    so clients never even see the CollabSpace name."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 10 — FINAL CTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Background: Full-width section with a subtle gradient texture:
  background: linear-gradient(135deg, #0D0D18 0%, #111828 50%, #0D0D18 100%)
  Overlay: very subtle grid pattern via CSS (background-image: 
  repeating-linear-gradient with 1px lines at 40px intervals, 2% opacity max)
  
Padding: 160px vertical

Content: Centered, max-width 700px

Headline: "Start building your first workspace today."
  72px, Instrument Serif italic — the serif makes it feel like a closing 
  statement, not a hard sell. It should feel calm and confident.

Sub-headline: "Free forever. No credit card. Setup in minutes."
  18px, var(--text-secondary)

CTA button: Large — "Create Your Free Workspace →"
  Padding: 20px 48px, font-size 18px, font-weight 600
  Background: var(--accent), color white, border-radius 12px
  Hover: scale(1.03) + glow: box-shadow 0 0 40px rgba(91,141,239,0.35)
  Subtle shimmer animation on the button (moving highlight, CSS only)

Below button: "Join 2,400+ workspaces already using CollabSpace"
  13px, var(--text-muted)
  Show 5 small avatar circles (overlapping, -8px margin) + that text

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 11 — FOOTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Background: var(--bg-surface)
Border-top: 1px solid var(--border)
Padding: 64px 0 40px

Layout: 5-column grid on desktop (logo col + 4 link columns), stack on mobile

Logo column (left):
  CollabSpace logo mark + wordmark
  Sub-text: "The unified workspace for freelancers and agencies."
  14px, var(--text-secondary), max-width 200px, line-height 1.6
  
  Social links (icon buttons):
    Twitter/X, GitHub, LinkedIn — small square buttons, 32px, border var(--border)
    SVG icons for each, color var(--text-secondary), hover: var(--text-primary)

Column 2 — Product:
  Label: "Product" (13px, uppercase, letter-spacing 0.1em, var(--text-muted))
  Links (14px, var(--text-secondary), hover var(--text-primary)):
    Features · Pricing · Changelog · Roadmap · Status

Column 3 — For Teams:
  Label: "For Teams"
  Links: Freelancers · Small Agencies · Remote Teams · Startups · Designers

Column 4 — Resources:
  Label: "Resources"
  Links: Documentation · API Reference · Blog · Community · Templates

Column 5 — Company:
  Label: "Company"
  Links: About · Careers · Press Kit · Contact · Privacy Policy · Terms

Bottom bar (below a divider line):
  Left: "© 2026 CollabSpace. All rights reserved."
  Right: "Made with ♥ for freelancers everywhere"
  Both in 13px, var(--text-muted)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JAVASCRIPT BEHAVIORS (required, implement all of these)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. NAVIGATION SCROLL SPY
   As user scrolls, update the active nav link to match the current section.
   Use IntersectionObserver on each section with id attributes.
   Active link gets: color var(--text-primary) + bottom border in --accent

2. SCROLL ANIMATIONS
   All sections below the hero fade in on scroll:
   Initial state: opacity 0, transform translateY(24px)
   Triggered state: opacity 1, transform translateY(0)
   Transition: 0.6s ease-out
   Use IntersectionObserver threshold 0.15
   Stagger child elements within each section (add delay: 0.1s per child)

3. MOBILE NAVIGATION
   Hamburger button toggles a full-screen overlay nav
   Overlay slides in from top (transform translateY(-100%) → translateY(0))
   Body scroll locked when open (overflow: hidden)
   Close on any nav link click or Escape key

4. PRICING TOGGLE
   Monthly/Annual toggle updates all prices simultaneously
   Smooth number transition (brief opacity fade, not a jarring swap)
   "Save 20%" badge appears/disappears with the toggle

5. FAQ ACCORDION
   Click question → answer expands with max-height transition
   Only one answer open at a time (close others on open)
   "+" icon animates to "×" (rotate 45deg)

6. SMOOTH SCROLL
   All anchor links (nav links, CTA links to sections) smooth scroll to target
   Offset by 80px to account for sticky nav height
   Use scroll-behavior: smooth on html element + JS for offset

7. BUTTON INTERACTIONS
   All CTA buttons: 
   - Hover: slight scale up (1.02) + glow effect
   - Active/click: scale down (0.98) brief
   - These should feel physical and satisfying

8. HERO PAGE LOAD ANIMATION SEQUENCE
   All triggered on DOMContentLoaded, staggered with setTimeout:
   t=0ms:    Nav fades in (opacity 0→1, 400ms)
   t=150ms:  Badge slides up (translateY(12px)→0, opacity 0→1, 500ms)
   t=300ms:  Hero headline line 1 (translateY(20px)→0, opacity 0→1, 600ms)
   t=450ms:  Hero headline line 2
   t=600ms:  Hero headline line 3
   t=750ms:  Sub-headline
   t=900ms:  CTA buttons
   t=1050ms: Trust signals
   t=1200ms: Stats row
   t=1400ms: Browser mockup (scale 0.96→1, opacity 0→1, 800ms)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSIVE RULES (non-negotiable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Breakpoints:
  Mobile: < 768px
  Tablet: 768px – 1024px
  Desktop: > 1024px

At mobile (< 768px):
  - Hero: single column, mockup below text, mockup scales to 100% width
  - Feature rows: mockup above, text below (both full width)
  - Pricing: single card per row, stacked
  - Testimonials: single column
  - How it works: vertical stack with down arrows
  - Footer: single column stack
  - Nav: hidden, hamburger shows
  - Font sizes: h1 → 40px, h2 → 28px, reduce all section padding to 80px

At tablet (768–1024px):
  - Hero: maintain split but reduce font sizes 10%
  - Features: keep 2 columns but tighten gap
  - Pricing: horizontal scroll or 1-column stack
  - Testimonials: 2 columns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY CHECKLIST — verify all of these before finishing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Google Fonts load correctly (Instrument Serif, DM Sans, JetBrains Mono)
□ All CSS custom properties (--bg, --accent, etc.) defined in :root
□ Sticky nav stays above all content (z-index correct)
□ Pricing toggle actually works and updates all prices
□ FAQ accordion opens/closes smoothly
□ Mobile hamburger menu opens, closes, locks scroll
□ All scroll animations trigger correctly (not all at once on load)
□ Hero mockup looks like a real app, not a wireframe
□ No horizontal scrollbar at any viewport width
□ All CTAs link to "#signup" (placeholder anchor)
□ Page feels fast — no heavy assets, no external JS libraries
□ The three font personalities are clearly distinct and work together