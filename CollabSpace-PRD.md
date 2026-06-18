**CollabSpace**

Freelance Collaboration Platform

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Full Product Requirements Document**

Technical Architecture · Database Schema · API Design · Development Roadmap

| **Version**  | 1.0 - MVP                            |
| ------------ | ------------------------------------ |
| **Status**   | Draft                                |
| **Date**     | April 2026                           |
| **Audience** | Engineering / Product / Stakeholders |

# **Table of Contents**

# **1\. Product Requirements Document**

## **1.1 Executive Summary**

CollabSpace is a unified SaaS platform purpose-built for freelancers, remote teams, and their clients. It eliminates the need for Slack (communication) + Trello (tasks) + Email (client updates) by delivering all three in a single, coherent workspace. Each project gets its own environment with real-time messaging, a Kanban task board, file sharing, and a client-friendly portal - all with role-based access control that ensures the right people see the right information.

**Core Value Proposition**

One workspace per project - no context switching, no lost information.

Clients get controlled visibility without seeing internal team discussions.

Freelancers always know exactly what to do next.

Teams onboard new contributors in minutes, not days.

## **1.2 Problem Statement**

The freelance collaboration market is fragmented. A typical freelancer manages a project across 5-7 disconnected tools, creating three compounding problems:

| **Problem**                | **Current State**                                    | **Business Impact**                         |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| **Context Switching**      | Slack → Trello → Email → Drive daily                 | 2-3 hours/day of productivity lost          |
| **Information Silos**      | Decisions made in DMs never reach the task board     | Rework, missed requirements, project delays |
| **Poor Client Visibility** | Clients send status emails; teams stop to respond    | Lower client satisfaction, higher churn     |
| **Contributor Onboarding** | New team members spend days piecing context together | Slow ramp-up, expensive knowledge transfer  |

## **1.3 Target Users**

### **Primary Users**

- Freelancers - developers, designers, marketers managing 1-10 active client projects
- Remote workers - distributed team members needing a shared workspace
- Small agencies - 2-15 people running multiple concurrent client engagements

### **Secondary Users**

- Clients - hiring managers who need visibility without access to internal operations
- Startup teams - companies working with external contributors on a project basis

## **1.4 User Personas**

| **Alex - Freelance Dev**                                                                                                         | **Priya - Agency PM**                                                                                                            | **Carlos - Client**                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Manages 4 concurrent client projects solo. Loses track of which client is waiting on what. Spends 1hr/day writing status emails. | Coordinates 3 developers across 8 projects. Her pain: new devs take 3 days to understand a project because context is scattered. | Hired a freelancer. Has no idea if work is progressing. Sends 'any updates?' emails every 48 hours. |
| Needs: one place for all client tasks + communication.                                                                           | Needs: self-service onboarding and clear project state visible at a glance.                                                      | Needs: read access to progress without bothering the team.                                          |

## **1.5 Roles & Permissions**

| **Permission**          | **Admin** | **Member** | **Client** | **Notes**               |
| ----------------------- | --------- | ---------- | ---------- | ----------------------- |
| Create Workspace        | ✅        | ❌         | ❌         | Admin = workspace owner |
| Manage Projects         | ✅        | ❌         | ❌         | Create, archive, delete |
| Invite Members          | ✅        | ❌         | ❌         | Members & Clients       |
| All Channels            | ✅        | ✅         | ❌         | Public + Private        |
| Client-visible Channels | ✅        | ✅         | ✅         | Explicitly marked       |
| Create / Edit Tasks     | ✅        | ✅         | ❌         |                         |
| View Tasks              | ✅        | ✅         | ✅         | Clients: read-only      |
| Upload Files            | ✅        | ✅         | ❌         |                         |
| View Files              | ✅        | ✅         | ✅         | All shared files        |
| View Project Dashboard  | ✅        | ✅         | ✅         | Clients: limited view   |
| Manage Billing (future) | ✅        | ❌         | ❌         |                         |

## **1.6 MVP Feature Specifications**

### **5.1 Authentication**

- Email/password registration with JWT (access token 15 min, refresh token 7 days)
- Email verification on signup
- Password reset via email link
- Workspace invitation via email link - recipient accepts or creates account
- Persistent login via secure httpOnly refresh token cookie

### **5.2 Workspace & Project System**

- A User can own one workspace (MVP) - multiple workspaces in V1
- Workspace has: name, slug (URL-safe), logo, owner, members list
- Projects live inside a workspace: name, description, status (active/archived), colour label
- Project invite flow: Admin generates invite link or sends direct email invite to member or client
- Project settings: rename, archive, transfer ownership, manage members

### **5.3 Channels (Messaging)**

- Channels belong to a project
- Types: Public (all team members), Private (invited members only), Client-visible (team + clients)
- Messages: plain text, markdown support, file attachments (up to 25 MB), @mentions
- @mention triggers in-app notification to mentioned user
- Real-time delivery via Socket.io rooms (one room per channel)
- Message history paginated (50 messages, infinite scroll upward)
- Unread message count badge per channel

### **5.4 Task Management (Kanban)**

- Each project has one Board
- Board contains ordered Lists (default: To Do, In Progress, Review, Done)
- Lists can be renamed, reordered, and added
- Tasks: title, rich description, assignee, due date, priority (Low/Medium/High/Urgent), status, labels, file attachments
- Drag-and-drop between lists (client-side with optimistic update; server persists position index)
- Task detail side panel - comments thread, activity log, file attachments
- Clients see tasks (read-only): title, description, assignee name (not email), due date, status

### **5.5 Project Dashboard**

- Summary metrics: total tasks, completed tasks, in-progress tasks, overdue tasks
- Progress ring chart (completion %)
- Recent activity feed: last 20 events (task created/moved/completed, message sent, file uploaded)
- Team member cards with their assigned task count
- Client view: progress chart, milestone list (if set), recent activity (filtered to client-visible events only)

### **5.6 File Sharing**

- Upload files in channels or on task cards
- Storage: S3 / Cloudinary (configurable)
- Max file size: 25 MB per file
- Supported types: images, PDFs, documents, archives, videos (preview for images + PDFs)
- Files tab per project: gallery view of all project files with source context

### **5.7 Notifications**

- In-app notification centre (bell icon) with unread count
- Notification types: task assigned, @mention, task moved to Done, file uploaded, new member joined
- Mark as read (individual + mark all read)
- Email digest (optional - V1 feature)

## **1.7 Out of Scope for MVP**

**MVP Exclusions - Deferred to V1 / V2**

Payments / invoicing

Time tracking

Video calls

Advanced analytics / reporting

Mobile native app (iOS / Android)

GitHub / Google Drive / Slack integrations

AI features

Custom domain per workspace

## **1.8 Success Metrics**

| **Metric**                        | **Month 1** | **Month 3** | **Month 6** |
| --------------------------------- | ----------- | ----------- | ----------- |
| **Projects created**              | 100         | 500         | 2,000       |
| **Daily Active Users**            | 50          | 300         | 1,500       |
| **Messages sent / project / day** | 5           | 12          | 20          |
| **Tasks completed / month**       | 500         | 3,000       | 15,000      |
| **Workspace → paid conversion**   | -           | 8%          | 15%         |
| **Week-2 retention**              | 40%         | 55%         | 65%         |

# **2\. Technical Architecture**

## **2.1 System Overview**

CollabSpace follows a decoupled frontend/backend architecture with a dedicated real-time layer. The three runtime concerns are cleanly separated:

**Architecture Layers**

Presentation Layer - Next.js App Router (SSR for dashboard pages, CSR for real-time UI)

API Layer - Node.js + Express REST API (stateless, horizontally scalable)

Real-time Layer - Socket.io server (message delivery, presence, notifications)

Data Layer - PostgreSQL via Prisma ORM

Storage Layer - AWS S3 (or Cloudinary) for file assets

## **2.2 Technology Stack**

| **Layer**              | **Technology**                | **Rationale**                                                                                |
| ---------------------- | ----------------------------- | -------------------------------------------------------------------------------------------- |
| **Frontend Framework** | **Next.js 14 (App Router)**   | SSR for SEO/initial load; CSR for real-time UI. Full-stack React with file-based routing.    |
| **Styling**            | **Tailwind CSS**              | Utility-first. No runtime CSS. Consistent design tokens.                                     |
| **State Management**   | **Zustand + React Query**     | Zustand for UI state; React Query for server state caching + invalidation.                   |
| **Backend Runtime**    | **Node.js 20 LTS**            | Single language across stack. Large ecosystem. Non-blocking I/O ideal for real-time.         |
| **HTTP Framework**     | **Express.js**                | Minimal, well-understood, huge middleware ecosystem. NestJS if team grows.                   |
| **ORM**                | **Prisma**                    | Type-safe DB client. Schema-as-code. Auto-migrations. Excellent DX.                          |
| **Database**           | **PostgreSQL 16**             | ACID, JSONB for flexible metadata, full-text search, row-level security.                     |
| **Real-time**          | **Socket.io**                 | Abstraction over WebSockets. Rooms, namespaces, reconnection built-in.                       |
| **Auth**               | **JWT (access + refresh)**    | Stateless access tokens (15 min). Refresh tokens (7 days) stored httpOnly cookie.            |
| **File Storage**       | **AWS S3 / Cloudinary**       | S3 for raw storage; Cloudinary for images (auto-resize, CDN). Signed URLs for private files. |
| **Email**              | **Resend + React Email**      | Modern email API. React-based email templates. Reliable deliverability.                      |
| **Deployment**         | **Railway / Render + Vercel** | Backend on Railway (includes PostgreSQL). Frontend on Vercel. Both have generous free tiers. |
| **CI/CD**              | **GitHub Actions**            | Lint → Test → Build → Deploy pipeline on every PR merge.                                     |

## **2.3 Infrastructure Diagram (Described)**

**Request Flow**

1\. Browser → Vercel Edge (Next.js): SSR page served, auth cookie validated

2\. Next.js server → Express API (REST): data fetching via fetch() with Authorization header

3\. Express → Prisma → PostgreSQL: query execution, response returned

4\. Browser → Socket.io server: persistent WS connection for real-time events

5\. File uploads: Browser → Presigned S3 URL (direct upload, bypasses API server)

6\. Socket.io emits: API server emits events to relevant Socket.io rooms after DB writes

## **2.4 Security Architecture**

### **Authentication**

- Access token: HS256 JWT, 15-minute expiry, signed with APP_SECRET
- Refresh token: opaque 256-bit random token stored in PostgreSQL, sent as httpOnly Secure SameSite=Strict cookie
- Token rotation: each refresh issues a new refresh token and invalidates the old one
- Logout: delete refresh token from DB + clear cookie

### **Authorization**

- Every API route validates JWT and extracts userId
- Workspace/project membership checked against DB on every request (no trust from client)
- Role checked per action - Admin, Member, Client scopes enforced in middleware
- Clients can only query channels/tasks where visibility = CLIENT

### **Input Validation**

- All request bodies validated with Zod schemas at the route layer
- SQL injection: impossible via Prisma parameterised queries
- XSS: HTML stripped from all text fields; markdown rendered safely client-side
- File uploads: MIME type validated server-side; max size enforced
- Rate limiting: express-rate-limit on auth endpoints (10 req/min), general API (100 req/min)

# **3\. Database Schema**

## **3.1 Entity Relationship Overview**

The schema follows these ownership relationships:

- User → owns Workspace → contains Projects → has Channels, Boards, Files
- Channel → has Messages (each with optional Attachments)
- Board → has Lists → has Tasks (each with optional Comments, Attachments)
- User ↔ Workspace (WorkspaceMember junction - role: ADMIN/MEMBER)
- User ↔ Project (ProjectMember junction - role: MEMBER/CLIENT)

## **3.2 Complete Prisma Schema**

// schema.prisma

generator client {

provider = "prisma-client-js"

}

datasource db {

provider = "postgresql"

url = env("DATABASE_URL")

}

// ─── Enums ────────────────────────────────────────────────

enum UserRole { ADMIN MEMBER CLIENT }

enum WorkspaceRole { ADMIN MEMBER }

enum ProjectRole { MEMBER CLIENT }

enum ChannelType { PUBLIC PRIVATE CLIENT }

enum TaskPriority { LOW MEDIUM HIGH URGENT }

enum TaskStatus { TODO IN_PROGRESS REVIEW DONE }

enum InviteStatus { PENDING ACCEPTED EXPIRED }

// ─── User ─────────────────────────────────────────────────

model User {

id String @id @default(cuid())

email String @unique

name String

avatarUrl String?

passwordHash String

emailVerified Boolean @default(false)

verifyToken String? @unique

refreshTokens RefreshToken\[\]

workspaces WorkspaceMember\[\]

projectMembers ProjectMember\[\]

sentMessages Message\[\]

assignedTasks Task\[\] @relation("AssignedTasks")

taskComments TaskComment\[\]

notifications Notification\[\]

uploadedFiles File\[\]

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

}

model RefreshToken {

id String @id @default(cuid())

token String @unique

userId String

user User @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)

expiresAt DateTime

createdAt DateTime @default(now())

}

// ─── Workspace ────────────────────────────────────────────

model Workspace {

id String @id @default(cuid())

name String

slug String @unique // URL-safe identifier

logoUrl String?

ownerId String

members WorkspaceMember\[\]

projects Project\[\]

invites WorkspaceInvite\[\]

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

}

model WorkspaceMember {

id String @id @default(cuid())

workspaceId String

userId String

role WorkspaceRole @default(MEMBER)

workspace Workspace @relation(fields: \[workspaceId\], references: \[id\], onDelete: Cascade)

user User @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)

joinedAt DateTime @default(now())

@@unique(\[workspaceId, userId\])

}

model WorkspaceInvite {

id String @id @default(cuid())

workspaceId String

workspace Workspace @relation(fields: \[workspaceId\], references: \[id\])

email String

role WorkspaceRole @default(MEMBER)

token String @unique

status InviteStatus @default(PENDING)

expiresAt DateTime

createdAt DateTime @default(now())

}

// ─── Project ──────────────────────────────────────────────

model Project {

id String @id @default(cuid())

name String

description String?

color String @default("#1E3A5F")

archived Boolean @default(false)

workspaceId String

workspace Workspace @relation(fields: \[workspaceId\], references: \[id\], onDelete: Cascade)

members ProjectMember\[\]

channels Channel\[\]

board Board?

files File\[\]

activities ActivityLog\[\]

invites ProjectInvite\[\]

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

}

model ProjectMember {

id String @id @default(cuid())

projectId String

userId String

role ProjectRole @default(MEMBER)

project Project @relation(fields: \[projectId\], references: \[id\], onDelete: Cascade)

user User @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)

joinedAt DateTime @default(now())

@@unique(\[projectId, userId\])

}

model ProjectInvite {

id String @id @default(cuid())

projectId String

project Project @relation(fields: \[projectId\], references: \[id\])

email String

role ProjectRole @default(MEMBER)

token String @unique

status InviteStatus @default(PENDING)

expiresAt DateTime

createdAt DateTime @default(now())

}

// ─── Channels & Messages ──────────────────────────────────

model Channel {

id String @id @default(cuid())

name String

type ChannelType @default(PUBLIC)

description String?

projectId String

project Project @relation(fields: \[projectId\], references: \[id\], onDelete: Cascade)

messages Message\[\]

createdAt DateTime @default(now())

@@unique(\[projectId, name\])

}

model Message {

id String @id @default(cuid())

content String // markdown

channelId String

senderId String

channel Channel @relation(fields: \[channelId\], references: \[id\], onDelete: Cascade)

sender User @relation(fields: \[senderId\], references: \[id\])

attachments File\[\]

mentions Mention\[\]

editedAt DateTime?

deletedAt DateTime? // soft delete

createdAt DateTime @default(now())

}

model Mention {

id String @id @default(cuid())

messageId String

userId String

message Message @relation(fields: \[messageId\], references: \[id\], onDelete: Cascade)

}

// ─── Board / Lists / Tasks ────────────────────────────────

model Board {

id String @id @default(cuid())

projectId String @unique

project Project @relation(fields: \[projectId\], references: \[id\], onDelete: Cascade)

lists List\[\]

createdAt DateTime @default(now())

}

model List {

id String @id @default(cuid())

name String

position Int // for ordering

boardId String

board Board @relation(fields: \[boardId\], references: \[id\], onDelete: Cascade)

tasks Task\[\]

createdAt DateTime @default(now())

}

model Task {

id String @id @default(cuid())

title String

description String? // markdown

position Int // for ordering within list

priority TaskPriority @default(MEDIUM)

status TaskStatus @default(TODO)

dueDate DateTime?

listId String

assigneeId String?

list List @relation(fields: \[listId\], references: \[id\], onDelete: Cascade)

assignee User? @relation("AssignedTasks", fields: \[assigneeId\], references: \[id\])

attachments File\[\]

comments TaskComment\[\]

labels TaskLabel\[\]

createdAt DateTime @default(now())

updatedAt DateTime @updatedAt

}

model TaskComment {

id String @id @default(cuid())

content String

taskId String

authorId String

task Task @relation(fields: \[taskId\], references: \[id\], onDelete: Cascade)

author User @relation(fields: \[authorId\], references: \[id\])

createdAt DateTime @default(now())

editedAt DateTime?

}

model TaskLabel {

id String @id @default(cuid())

name String

color String

taskId String

task Task @relation(fields: \[taskId\], references: \[id\], onDelete: Cascade)

}

// ─── Files ────────────────────────────────────────────────

model File {

id String @id @default(cuid())

name String

url String

size Int // bytes

mimeType String

projectId String?

messageId String?

taskId String?

uploadedById String

project Project? @relation(fields: \[projectId\], references: \[id\])

message Message? @relation(fields: \[messageId\], references: \[id\])

task Task? @relation(fields: \[taskId\], references: \[id\])

uploadedBy User @relation(fields: \[uploadedById\], references: \[id\])

createdAt DateTime @default(now())

}

// ─── Notifications ────────────────────────────────────────

model Notification {

id String @id @default(cuid())

userId String

type String // TASK_ASSIGNED | MENTIONED | TASK_DONE | FILE_UPLOADED

title String

body String?

link String? // deep link to the relevant resource

read Boolean @default(false)

user User @relation(fields: \[userId\], references: \[id\], onDelete: Cascade)

createdAt DateTime @default(now())

}

// ─── Activity Log ─────────────────────────────────────────

model ActivityLog {

id String @id @default(cuid())

projectId String

actorId String? // null = system

type String // TASK_CREATED | TASK_MOVED | MESSAGE_SENT | FILE_UPLOADED | MEMBER_JOINED

meta Json // flexible event data

clientVisible Boolean @default(false)

project Project @relation(fields: \[projectId\], references: \[id\], onDelete: Cascade)

createdAt DateTime @default(now())

}

# **4\. Folder Structure**

## **4.1 Backend (Node.js / Express)**

backend/

├── prisma/

│ ├── schema.prisma # Single source of truth for DB schema

│ ├── migrations/ # Auto-generated migration files

│ └── seed.ts # Dev seed data

├── src/

│ ├── config/

│ │ ├── env.ts # Zod-validated environment config

│ │ ├── cors.ts # CORS origins

│ │ └── storage.ts # S3 / Cloudinary config

│ ├── lib/

│ │ ├── prisma.ts # Singleton Prisma client

│ │ ├── jwt.ts # Token sign / verify helpers

│ │ ├── email.ts # Resend email client

│ │ ├── s3.ts # S3 presigned URL generator

│ │ └── socket.ts # Socket.io server init + room helpers

│ ├── middleware/

│ │ ├── authenticate.ts # JWT validation → req.user

│ │ ├── requireRole.ts # Role guard factory

│ │ ├── validate.ts # Zod schema body validator

│ │ ├── rateLimiter.ts # express-rate-limit configs

│ │ └── errorHandler.ts # Global error → JSON response

│ ├── modules/

│ │ ├── auth/

│ │ │ ├── auth.router.ts

│ │ │ ├── auth.controller.ts

│ │ │ ├── auth.service.ts

│ │ │ └── auth.schema.ts # Zod request schemas

│ │ ├── workspaces/

│ │ │ ├── workspace.router.ts

│ │ │ ├── workspace.controller.ts

│ │ │ └── workspace.service.ts

│ │ ├── projects/

│ │ │ ├── project.router.ts

│ │ │ ├── project.controller.ts

│ │ │ └── project.service.ts

│ │ ├── channels/

│ │ │ ├── channel.router.ts

│ │ │ ├── channel.controller.ts

│ │ │ └── channel.service.ts

│ │ ├── messages/

│ │ │ ├── message.router.ts

│ │ │ ├── message.controller.ts

│ │ │ └── message.service.ts

│ │ ├── boards/

│ │ │ ├── board.router.ts

│ │ │ ├── board.controller.ts

│ │ │ └── board.service.ts

│ │ ├── tasks/

│ │ │ ├── task.router.ts

│ │ │ ├── task.controller.ts

│ │ │ └── task.service.ts

│ │ ├── files/

│ │ │ ├── file.router.ts

│ │ │ ├── file.controller.ts

│ │ │ └── file.service.ts

│ │ └── notifications/

│ │ ├── notification.router.ts

│ │ ├── notification.controller.ts

│ │ └── notification.service.ts

│ ├── events/

│ │ └── activity.emitter.ts # ActivityLog + Socket.io event bus

│ ├── types/

│ │ └── express.d.ts # Augment req.user type

│ └── app.ts # Express app setup

├── server.ts # HTTP + Socket.io server bootstrap

├── tsconfig.json

├── package.json

└── .env.example

## **4.2 Frontend (Next.js 14)**

frontend/

├── app/

│ ├── (auth)/

│ │ ├── login/page.tsx

│ │ ├── signup/page.tsx

│ │ └── verify-email/page.tsx

│ ├── (app)/ # Authenticated shell

│ │ ├── layout.tsx # Sidebar + auth guard

│ │ ├── dashboard/page.tsx # Workspace overview

│ │ └── workspace/\[slug\]/

│ │ ├── layout.tsx # Workspace sidebar

│ │ ├── page.tsx # Workspace home

│ │ └── projects/\[projectId\]/

│ │ ├── layout.tsx # Project nav tabs

│ │ ├── page.tsx # Project dashboard

│ │ ├── board/page.tsx # Kanban board

│ │ ├── channels/

│ │ │ └── \[channelId\]/page.tsx

│ │ └── files/page.tsx

│ ├── invite/\[token\]/page.tsx # Accept invite

│ ├── client/\[token\]/page.tsx # Client portal (no auth)

│ ├── layout.tsx

│ └── globals.css

├── components/

│ ├── ui/ # shadcn/ui base components

│ ├── auth/

│ │ ├── LoginForm.tsx

│ │ └── SignupForm.tsx

│ ├── workspace/

│ │ ├── WorkspaceSidebar.tsx

│ │ └── CreateWorkspaceModal.tsx

│ ├── project/

│ │ ├── ProjectHeader.tsx

│ │ ├── ProjectDashboard.tsx

│ │ └── ProjectSettings.tsx

│ ├── board/

│ │ ├── KanbanBoard.tsx

│ │ ├── KanbanList.tsx

│ │ ├── TaskCard.tsx

│ │ └── TaskDetailPanel.tsx

│ ├── channels/

│ │ ├── ChannelList.tsx

│ │ ├── MessageFeed.tsx

│ │ ├── MessageInput.tsx

│ │ └── MessageItem.tsx

│ ├── notifications/

│ │ └── NotificationBell.tsx

│ └── shared/

│ ├── Avatar.tsx

│ ├── FileUploader.tsx

│ └── EmptyState.tsx

├── hooks/

│ ├── useAuth.ts

│ ├── useSocket.ts

│ ├── useMessages.ts

│ └── useBoard.ts

├── lib/

│ ├── api.ts # Typed fetch wrapper

│ ├── socket.ts # Socket.io client singleton

│ └── utils.ts

├── stores/

│ ├── authStore.ts # Zustand: current user

│ └── notificationStore.ts # Zustand: unread count

├── types/

│ └── index.ts # Shared TypeScript types

└── tailwind.config.ts

# **5\. API Design**

## **5.1 Conventions**

- Base URL: <https://api.collabspace.io/v1>
- All responses: { data: T } on success, { error: string, details?: object } on failure
- Authentication: Authorization: Bearer &lt;access_token&gt; header on all protected routes
- Pagination: ?page=1&limit=50 query params; response includes { data, total, page, limit }
- HTTP status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Validation Error, 500 Internal Server Error

## **5.2 Authentication Endpoints**

| **Method** | **Endpoint**          | **Description**                              |
| ---------- | --------------------- | -------------------------------------------- |
| **POST**   | /auth/register        | Create user account, send verification email |
| **POST**   | /auth/verify-email    | Verify email with token from URL             |
| **POST**   | /auth/login           | Issue access + refresh tokens                |
| **POST**   | /auth/refresh         | Exchange refresh token for new access token  |
| **POST**   | /auth/logout          | Invalidate refresh token                     |
| **POST**   | /auth/forgot-password | Send password reset email                    |
| **POST**   | /auth/reset-password  | Set new password with reset token            |

### **POST /auth/register - Example**

// Request body

{

"name": "Alex Johnson",

"email": "<alex@example.com>",

"password": "SecurePass123!"

}

// Response 201

{

"data": {

"user": { "id": "clx...", "name": "Alex Johnson", "email": "<alex@example.com>" },

"accessToken": "eyJhbGci..."

}

}

// Refresh token set as httpOnly cookie: Set-Cookie: refreshToken=...; HttpOnly; Secure

## **5.3 Workspace Endpoints**

| **Method** | **Endpoint**                      | **Description**                     |
| ---------- | --------------------------------- | ----------------------------------- |
| **POST**   | /workspaces                       | Create workspace (becomes Admin)    |
| **GET**    | /workspaces/mine                  | Get workspaces the user belongs to  |
| **GET**    | /workspaces/:slug                 | Get workspace details + members     |
| **PATCH**  | /workspaces/:slug                 | Update name / logo (Admin only)     |
| **POST**   | /workspaces/:slug/invite          | Invite member by email (Admin only) |
| **GET**    | /workspaces/:slug/members         | List workspace members              |
| **DELETE** | /workspaces/:slug/members/:userId | Remove member (Admin only)          |
| **GET**    | /invites/:token                   | Get invite details (public)         |
| **POST**   | /invites/:token/accept            | Accept workspace invite             |

## **5.4 Project Endpoints**

| **Method** | **Endpoint**                                   | **Description**                      |
| ---------- | ---------------------------------------------- | ------------------------------------ |
| **POST**   | /workspaces/:slug/projects                     | Create project                       |
| **GET**    | /workspaces/:slug/projects                     | List all projects in workspace       |
| **GET**    | /workspaces/:slug/projects/:projectId          | Get project details + dashboard data |
| **PATCH**  | /workspaces/:slug/projects/:projectId          | Update project (Admin)               |
| **POST**   | /workspaces/:slug/projects/:projectId/invite   | Invite member or client              |
| **GET**    | /workspaces/:slug/projects/:projectId/members  | List project members                 |
| **DELETE** | /workspaces/:slug/projects/:projectId          | Archive project (Admin)              |
| **GET**    | /workspaces/:slug/projects/:projectId/activity | Get activity log                     |

## **5.5 Channel & Message Endpoints**

| **Method** | **Endpoint**                                      | **Description**                        |
| ---------- | ------------------------------------------------- | -------------------------------------- |
| **POST**   | /projects/:id/channels                            | Create channel (PUBLIC/PRIVATE/CLIENT) |
| **GET**    | /projects/:id/channels                            | List channels (filtered by user role)  |
| **GET**    | /projects/:id/channels/:channelId                 | Get channel info                       |
| **GET**    | /projects/:id/channels/:channelId/messages        | Paginated message history              |
| **POST**   | /projects/:id/channels/:channelId/messages        | Send message (REST fallback)           |
| **PATCH**  | /projects/:id/channels/:channelId/messages/:msgId | Edit message (own only)                |
| **DELETE** | /projects/:id/channels/:channelId/messages/:msgId | Soft-delete message (own only)         |

### **Real-time Message Flow (Socket.io)**

// Client joins channel room after page load

socket.emit('channel:join', { channelId: 'clx_123' })

// Client sends message via socket (primary path)

socket.emit('message:send', {

channelId: 'clx_123',

content: 'Hey @priya, the designs are ready!',

attachmentIds: \[\]

})

// Server persists to DB, then broadcasts to room

io.to('channel:clx_123').emit('message:new', {

id: 'msg_456',

content: 'Hey @priya, the designs are ready!',

sender: { id: '...', name: 'Alex', avatarUrl: '...' },

createdAt: '2026-04-01T10:30:00Z',

attachments: \[\]

})

// Mention notification emitted to mentioned user's room

io.to('user:priya_id').emit('notification:new', {

type: 'MENTIONED',

title: 'Alex mentioned you in #general',

link: '/projects/xyz/channels/clx_123'

})

## **5.6 Task & Board Endpoints**

| **Method** | **Endpoint**                               | **Description**                   |
| ---------- | ------------------------------------------ | --------------------------------- |
| **GET**    | /projects/:id/board                        | Get full board (lists + tasks)    |
| **POST**   | /projects/:id/board/lists                  | Create new list                   |
| **PATCH**  | /projects/:id/board/lists/:listId          | Rename / reorder list             |
| **DELETE** | /projects/:id/board/lists/:listId          | Delete list (must be empty)       |
| **POST**   | /projects/:id/board/tasks                  | Create task                       |
| **GET**    | /projects/:id/board/tasks/:taskId          | Get task detail                   |
| **PATCH**  | /projects/:id/board/tasks/:taskId          | Update task fields                |
| **POST**   | /projects/:id/board/tasks/:taskId/move     | Move to different list + position |
| **DELETE** | /projects/:id/board/tasks/:taskId          | Delete task                       |
| **POST**   | /projects/:id/board/tasks/:taskId/comments | Add comment to task               |
| **GET**    | /projects/:id/board/tasks/:taskId/comments | Get task comments                 |

### **PATCH /projects/:id/board/tasks/:taskId/move - Drag & Drop**

// Request body - when user drops card into new list position

{

"targetListId": "list_done_id",

"position": 2 // 0-indexed position in target list

}

// Server response 200

{

"data": {

"id": "task_xyz",

"listId": "list_done_id",

"position": 2,

"status": "DONE", // auto-updated when dropped on Done list

"updatedAt": "2026-04-01T11:00:00Z"

}

}

// Socket.io broadcast to all project members

io.to('project:proj_id').emit('task:moved', {

taskId: 'task_xyz',

fromListId: 'list_inprog_id',

toListId: 'list_done_id',

position: 2

})

## **5.7 File Endpoints**

POST /files/presign // Get S3 presigned upload URL

// Request: { filename, mimeType, size, projectId?, messageId?, taskId? }

// Response: { uploadUrl, fileId, publicUrl }

POST /files/:fileId/confirm // Confirm upload complete → saves File record in DB

GET /projects/:id/files // List all project files

DELETE /files/:fileId // Delete file (uploader or Admin)

# **6\. Development Roadmap**

## **6.1 Phase Overview**

| **Phase** | **Duration** | **Target**            | **Goal**                                                     |
| --------- | ------------ | --------------------- | ------------------------------------------------------------ |
| **MVP**   | 10 wks       | Core feature complete | Validated, shippable product with paying early adopters      |
| **V1**    | 6 wks        | Growth & Polish       | Retention features, email notifications, multiple workspaces |
| **V2**    | 8 wks        | Monetisation          | Time tracking, billing, integrations, analytics              |

## **6.2 MVP - 10 Weeks**

| **Sprint**               | **Focus**               | **Deliverables**                                                                                                                         |
| ------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Sprint 1-2 (Wks 1-2)** | **Foundation**          | Repo setup, CI/CD, DB on Railway, Prisma schema + migrations, env config, error handling middleware, rate limiting, Zod validation layer |
| **Sprint 3 (Wk 3)**      | **Auth**                | Register, email verification, login, JWT refresh, logout, password reset, auth middleware, invite token generation                       |
| **Sprint 4 (Wk 4)**      | **Workspaces**          | Create workspace, slug generation, workspace members, invite flow, workspace settings CRUD                                               |
| **Sprint 5 (Wk 5)**      | **Projects**            | Create project, project members, project invite (member + client roles), project settings, archive                                       |
| **Sprint 6 (Wk 6)**      | **Channels & Messages** | Channel CRUD (PUBLIC/PRIVATE/CLIENT), Socket.io rooms, real-time message delivery, message history (paginated), @mentions, unread counts |
| **Sprint 7 (Wk 7)**      | **Task Board**          | Board + List CRUD, Task CRUD, drag-and-drop move endpoint, task comments, task labels, assignee, due dates, priority                     |
| **Sprint 8 (Wk 8)**      | **Files & Notifs**      | S3 presigned upload, file confirm, file listing, in-app notifications (Socket.io delivery + REST polling fallback), notification bell    |
| **Sprint 9 (Wk 9)**      | **Dashboard & Portal**  | Project dashboard (stats, activity feed), client-facing portal (filtered view), dashboard API aggregation endpoint                       |
| **Sprint 10 (Wk 10)**    | **QA & Launch**         | E2E tests (Playwright), load testing (k6), bug bash, security audit (OWASP Top 10 checklist), staging deploy, beta launch to waitlist    |

## **6.3 V1 - Post-MVP (Weeks 11-16)**

- Email notification digest (daily / immediate - user preference)
- Multiple workspaces per user
- Rich text editor for task descriptions (Tiptap with image embeds)
- Advanced search (full-text across messages, tasks, files within a project)
- Workspace audit log (admin-only view of all member actions)
- Task due date reminders (cron + email)
- Onboarding flow - interactive checklist for new workspace owners
- Billing & subscription (Stripe) - Free tier (3 projects) / Pro (\$29/mo unlimited)

## **6.4 V2 - Monetisation & Integrations (Weeks 17-24)**

- Time tracking - log hours against tasks, per-project time reports
- Invoicing - generate invoice from tracked time, send to client via portal
- GitHub integration - link PRs/commits to tasks, auto-move task on merge
- Google Drive integration - attach Drive files to tasks/channels
- Analytics dashboard - project velocity, team utilisation, client engagement
- Mobile PWA - offline-capable, push notifications
- AI features - task auto-suggest, meeting note summarisation, status update drafting

# **7\. Risks & Best Practices**

## **7.1 Technical Risks**

| **Risk**                                                | **Severity** | **Mitigation**                                                                                                           |
| ------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **Socket.io connection drops lose messages**            | **High**     | Client-side acknowledgements + REST fallback for send; client re-fetches last N messages on reconnect                    |
| **Drag-and-drop position conflicts (concurrent users)** | **Medium**   | Use fractional indexing (e.g. lexorank) for position values - no integer collision when two users reorder simultaneously |
| **N+1 query performance on board load**                 | **High**     | Use Prisma's include with nested select; add DB indexes on listId, boardId, projectId, assigneeId                        |
| **File upload size / cost explosion**                   | **Medium**   | Enforce 25 MB max on API + S3 policy; per-workspace storage quota in V1; Cloudinary for image transformation             |
| **JWT secret rotation breaks all sessions**             | **Medium**   | Support two active secrets (current + previous) during rotation window                                                   |
| **Client data isolation breach**                        | **Critical** | Double-check every query filters by projectId AND verifies user is ProjectMember before returning data                   |
| **Scaling Socket.io beyond one server**                 | **Medium**   | Use Redis adapter (socket.io-redis) from the start - enables multi-instance deployment without code changes              |

## **7.2 Production Best Practices**

### **Database**

- Add indexes on all foreign keys and frequently queried columns (projectId, channelId, assigneeId, createdAt DESC)
- Use Prisma's \$transaction for operations that span multiple tables (e.g. move task + update activity log)
- Soft delete messages and tasks - never hard delete; use deletedAt timestamp
- Run EXPLAIN ANALYZE on the board fetch query before launch - it loads all lists + tasks at once

### **API**

- Always validate workspace/project membership server-side - never trust role from request body
- Return consistent error shapes: { error: string, code: string, details?: object }
- Use cursor-based pagination for message history - offset pagination breaks with real-time inserts
- Set Content-Security-Policy, X-Content-Type-Options, X-Frame-Options headers

### **Real-time**

- Emit events after DB commit succeeds - never optimistically emit before persistence
- Join socket rooms based on verified DB membership - validate on socket connect, not just JWT
- Use socket.io acknowledgements for message:send - client retries if no ack within 5 seconds

### **Frontend**

- Optimistic UI for drag-and-drop: update local state immediately, revert on API error
- Zustand for client-only state (auth user, notification count); React Query for all server data
- Memoize task cards (React.memo) - Kanban boards re-render aggressively on socket events
- Infinite scroll for message history using IntersectionObserver - no 'Load More' button

## **7.3 Observability Checklist**

- Structured JSON logging (pino) - every request logs: method, path, userId, statusCode, durationMs
- Error tracking: Sentry (BE + FE) from day 1
- Uptime monitoring: Better Uptime or Betterstack pinging /health every 30 seconds
- Database connection pool monitoring: Prisma metrics or pg_stat_activity
- Socket.io room count logged every 5 minutes to detect connection leaks

## **7.4 Environment Variables**

\# .env.example - backend

DATABASE_URL=postgresql://user:pass@host:5432/collabspace

JWT_ACCESS_SECRET=&lt;256-bit-random&gt;

JWT_REFRESH_SECRET=&lt;256-bit-random&gt;

JWT_ACCESS_EXPIRES_IN=15m

JWT_REFRESH_EXPIRES_IN=7d

AWS_REGION=us-east-1

AWS_S3_BUCKET=collabspace-files

AWS_ACCESS_KEY_ID=&lt;key&gt;

AWS_SECRET_ACCESS_KEY=&lt;secret&gt;

RESEND_API_KEY=&lt;key&gt;

RESEND_FROM_EMAIL=<noreply@collabspace.io>

FRONTEND_URL=<https://collabspace.io>

REDIS_URL=redis://localhost:6379 # for Socket.io adapter in production

PORT=4000

NODE_ENV=production

# **8\. MVP Milestones & Definition of Done**

| **Milestone**               | **Week Target** | **Definition of Done**                                                                                                                                                |
| --------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M1 - Auth Live**          | Week 3          | User can register, verify email, login, receive JWT, call /me endpoint successfully. Refresh token rotation working.                                                  |
| **M2 - Workspaces Live**    | Week 4          | User can create workspace, invite member via email link, accept invite, see themselves in member list. Role enforced on protected routes.                             |
| **M3 - Projects Live**      | Week 5          | Admin can create project, invite client (limited access). Client logs in, sees project but not private channels. Project dashboard renders.                           |
| **M4 - Messaging Live**     | Week 6          | Two browser tabs: message sent in one appears in other in < 500ms. @mention delivers notification. Message history loads paginated. Client sees CLIENT channels only. |
| **M5 - Task Board Live**    | Week 7          | Kanban board renders. Card drags between columns persisted after page refresh. Task detail panel opens. Comments save. Assignment notifies assignee.                  |
| **M6 - Files & Notifs**     | Week 8          | File uploads to S3, appears in project Files tab and on task card. Notification bell shows unread count. Mark-all-read works.                                         |
| **M7 - Dashboard Complete** | Week 9          | Project dashboard shows accurate stats (task counts, progress %). Activity feed shows last 20 events. Client portal view filtered correctly.                          |
| **M8 - Launch Ready**       | Week 10         | Zero P1/P2 bugs. Lighthouse score ≥ 85. Load test: 100 concurrent users, p95 API < 400ms. OWASP Top 10 checklist complete. Staging identical to production config.    |

- End of Document -

CollabSpace · Version 1.0 · April 2026