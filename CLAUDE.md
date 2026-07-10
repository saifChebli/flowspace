# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

CollabSpace / Flowspace — a freelance-collaboration SaaS (per-project workspace combining real-time messaging, a Kanban board, file sharing, and a client portal). Monorepo with two independently-deployed apps:

- `server/` — Node.js + Express + **Socket.io** + Prisma (PostgreSQL on Supabase). TypeScript.
- `client/` — **Next.js 16 (App Router) + React 19**, Zustand + React Query, Tailwind.

Product spec lives in `CollabSpace-PRD.md`; VPS deploy guide in `DEPLOYMENT.md`.

## Commands

Run inside `server/` or `client/` (each has its own `package.json`).

**server/**
- `npm run dev` — tsx watch on `src/server.ts`
- `npm run build` — `tsc` → `dist/`; `npm start` runs `dist/server.js`
- `npm run lint` — ESLint (config: `server/.eslintrc.json`, classic eslintrc)
- `npm test` — Jest. Single test: `npx jest src/__tests__/auth.service.test.ts` or `npx jest -t "acceptProjectInvite"`. Tests mock Prisma per-file via `jest.mock('../lib/prisma')` — new service tests must add every `prisma.<model>` they touch to the mock.
- `npm run db:generate` (prisma generate — also runs on `postinstall`), `db:migrate` (dev), `db:seed`, `db:studio`. Production applies migrations with `npx prisma migrate deploy`.

**client/**
- `npm run dev` / `npm run build` / `npm run lint` (`eslint .`, flat config `eslint.config.mjs`). No test setup.

**Prisma gotcha (Windows):** `prisma generate` fails with `EPERM` if `tsx watch` (the dev server) is running — it locks the query-engine DLL. Stop the dev server first.

## Architecture — the big picture

### Backend is a single stateful process (cannot be serverless)
`src/server.ts` creates the HTTP server + Socket.io and **exports the `io` singleton**. Domain services import `io` and emit events to rooms **after** DB writes (e.g. `io.to(\`user:${id}\`).emit('notification:new')`). Rooms: `user:<id>` (notifications), `channel:<id>` (messages), `project:<id>` (board/tasks). Because real-time relies on this in-memory `io` and long-lived WebSocket connections, the backend **must run as one persistent process** — it can't go on Vercel/serverless, and multi-instance would need a Socket.io Redis adapter. `src/app.ts` (`createApp`) builds the Express app separately from the socket bootstrap.

### Modular domains
Each feature is `src/modules/<domain>/{router,controller,service,schema}.ts` (schema = Zod request validation). Domains: auth, workspaces, projects, channels, messages, boards, tasks, files, notifications, dashboard, portal. Routers are mounted in `app.ts`. Shared pieces: `src/middleware/` (`auth`, `portalAuth`, `rateLimiter`, `errorHandler`), `src/lib/` (`prisma`, `jwt`, `email`, `cloudinary`, `s3`), `src/config/` (`env`, `cors`, `storage`), `src/events/activity.ts`.

### Two parallel auth systems
- **Team users → JWT.** `authenticate` middleware sets `req.user`. Access token (15 min) is held **in memory on the client**; the refresh token (7 days) lives in an **httpOnly cookie** (`SameSite=None; Secure` in production, `path=/api/auth`), rotated on `POST /api/auth/refresh`. `app.set('trust proxy', 1)` is required so Secure cookies work behind a proxy.
- **Clients → passwordless portal.** A `PortalSession` token is sent via the **`X-Portal-Token` header**; `authenticatePortal` sets `req.portalUser`. `authenticateAny` accepts either scheme.

### Passwordless client-portal flow (deliberate design)
CLIENT invites are **not** the member signup flow. `inviteProjectMember` emails a `/portal/invite/[token]` link → `POST /api/portal/invite/:token/accept` auto-provisions a passwordless `User` (`passwordHash: null`, `emailVerified: true`), joins them as CLIENT, ensures `Project.clientPortalToken`, creates a `PortalSession`, and the client lands directly on `/portal/dashboard/[projectId]` — no signup screen. `login` rejects null-`passwordHash` accounts; clients may optionally set a password via `POST /api/portal/set-password`.

### Data-model notes (server/prisma/schema.prisma) that differ from the obvious
`BoardList` (not `List`); a Task's board is reached via its list. `Task` has a `status` enum **and** `deletedAt` (soft delete — filter `deletedAt: null` in queries). Multiple assignees via `TaskAssignee` junction; `labels` is `String[]`. `InviteToken` is unified (optional `workspaceId` **or** `projectId`). `ChannelType` includes `CLIENT_VISIBLE`. `passwordHash` is nullable. `ActivityLog` (with a `clientVisible` flag) powers the dashboard feed — write to it via `logActivity()` in `src/events/activity.ts` (it never throws; failures are swallowed). Add new env vars to the Zod schema in `src/config/env.ts` or startup fails.

### Frontend
Next.js 16 App Router. Two axios clients: `lib/api.ts` (team — attaches the in-memory access token, and on 401 refreshes via the cookie using a single shared promise) and `lib/portalApi.ts` (client — attaches `X-Portal-Token` from localStorage). State: Zustand `authStore` (persists only `user` + `isAuthenticated`; the access token stays in memory and is re-minted from the refresh cookie on reload) and `portalStore`; React Query for all server data. Socket client in `lib/socket.ts`. Env vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`.

## Critical constraints

- **`client/AGENTS.md`: this Next.js 16 build is modified** — read the relevant guide in `client/node_modules/next/dist/docs/` before writing client code; don't assume App Router APIs match training data. `next lint` was removed; linting is the ESLint CLI + flat config.
- **Email is Nodemailer/SMTP (Gmail) and must stay that way** — do **not** migrate to Resend (a deliberate decision). Templates are hand-written HTML strings in `src/lib/email.ts` following the `baseLayout`/`ctaButton` helpers.
- **Backend hosting must allow outbound SMTP and a persistent process.** Managed PaaS free tiers (Railway/Render/Fly) block outbound SMTP, which breaks all email; the backend therefore runs on a **VPS** (Nginx + PM2 + certbot), while the **frontend is on Vercel** and Postgres on **Supabase**. Frontend↔backend are different origins, so CORS (`config/cors.ts`) allows `CLIENT_URL` + `*.vercel.app`, and the refresh cookie must be cross-site (`SameSite=None; Secure`).
