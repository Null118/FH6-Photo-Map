# Auth Role Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build separate front-end user login and back-office admin login, with cookie sessions and admin-only route protection.

**Architecture:** Add a minimal first-party auth layer using Prisma-backed users, password hashing with Node crypto, and signed cookie sessions stored via Next.js server APIs. Keep public login at `/login`, move administrator authentication to `/admin/login`, and protect `/admin` routes with server-side guards while updating homepage UI based on session state.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma, SQLite, Node `crypto`, Zod, Vitest

---

### Task 1: Define auth data model

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`

- [ ] Add `UserRole` enum and `User` model with `username`, `displayName`, `passwordHash`, `role`, timestamps, and unique username.
- [ ] Seed one admin account and one normal user account using the same password hashing helper that production code uses.
- [ ] Keep existing seeded location/photo content unchanged.

### Task 2: Add auth test coverage first

**Files:**
- Create: `src/lib/auth.test.ts`
- Modify: `src/types/index.ts`

- [ ] Write failing tests for password hashing and verification behavior.
- [ ] Write failing tests for session payload encode/decode behavior.
- [ ] Write failing tests for role helper behavior:
  - admin session is recognized as admin
  - normal user session is not recognized as admin
  - invalid session payload resolves to null

### Task 3: Implement auth primitives

**Files:**
- Create: `src/lib/auth.ts`
- Modify: `src/types/index.ts`

- [ ] Implement password hashing and verification with `scryptSync`, random salt, and timing-safe comparison.
- [ ] Implement signed session token creation and verification using HMAC with `AUTH_SECRET`.
- [ ] Export shared auth/session/user role types from `src/types/index.ts`.
- [ ] Keep helpers framework-agnostic so they are easy to test without mocking Next APIs.

### Task 4: Add server auth helpers and login actions

**Files:**
- Create: `src/lib/auth-server.ts`
- Create: `src/app/actions/auth-actions.ts`
- Modify: `src/lib/db.ts`

- [ ] Add cookie helpers that use `await cookies()` per Next 16 guidance.
- [ ] Add helpers to:
  - read current session
  - require any logged-in user
  - require admin user
  - create login session
  - clear login session
- [ ] Add server actions for:
  - public user login at `/login`
  - admin login at `/admin/login`
  - logout
- [ ] Make admin login reject non-admin accounts even if password is correct.

### Task 5: Protect admin routes and expose session-aware UI

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `src/app/admin/locations/page.tsx`
- Modify: `src/app/admin/locations/[id]/page.tsx`
- Modify: `src/app/admin/photos/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/map/map-canvas.tsx`
- Modify: `src/components/map/map-hud.tsx`
- Modify: `src/components/map/map-bottom-bar.tsx`

- [ ] Require admin session at the top of every `/admin` page and redirect unauthenticated users to `/admin/login`.
- [ ] Remove public homepage HUD link that directly exposes “进入管理中心”.
- [ ] Make homepage receive current session and render bottom bar as:
  - not logged in: `问题反馈`, `用户登录`
  - logged in normal user: `问题反馈`, `退出登录`
  - logged in admin: `问题反馈`, `退出登录`
- [ ] Keep admin entry off the homepage UI.

### Task 6: Build dedicated login pages

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/components/forms/login-form.tsx`
- Modify: `src/app/globals.css`

- [ ] Create reusable login form component with title, description, username/password fields, submit button, and inline error state.
- [ ] Public `/login` should log in any valid account, then:
  - normal user -> redirect `/`
  - admin user -> redirect `/admin`
- [ ] `/admin/login` should only allow admin accounts and redirect admins into `/admin`.
- [ ] If already logged in, redirect away from login pages to the correct destination.

### Task 7: Run database and app verification

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`
- Create/Modify as needed from previous tasks

- [ ] Run Prisma validation/generation/migration for the new `User` model.
- [ ] Run seed so admin/user accounts exist locally.
- [ ] Run focused auth tests first, then full `test:run`, `lint`, and `build`.
- [ ] Confirm no admin pages are accessible without admin session.
