# StayGuide Pro

A production-style, multi-tenant SaaS for Airbnb hosts, vacation-rental owners and small
property managers. It turns each property into a **mobile-first digital guest guide** (videos,
images, multilingual instructions, QR codes), adds a **grounded AI guest assistant**, automated
guest-message templates, issue reporting, cleaning/turnover and inventory operations, a review
assistant, and analytics — all behind authentication, organizations, roles and Stripe billing.

> Not a pricing tool. There is no dynamic pricing — by design.

## Tech stack

- **Next.js 15** (App Router, Server Actions, Route Handlers) + **TypeScript** (strict)
- **Tailwind CSS** + hand-rolled **shadcn-style** UI (Radix primitives)
- **PostgreSQL** + **Prisma** ORM
- **Auth**: credential auth with JWT session cookies (`jose` + `bcryptjs`), multi-tenant org context + RBAC
- **Integrations (all optional, graceful offline fallbacks)**: OpenAI (AI), Stripe (billing),
  Resend (email), S3-compatible storage. With no keys the app runs fully locally — AI uses a
  deterministic retrieval fallback, billing runs in "mock" mode, emails log to the console,
  uploads go to `public/uploads`.

## Quick start

```bash
# 1. Start Postgres (Docker)
docker run -d --name stayguide-pg \
  -e POSTGRES_PASSWORD=stayguide -e POSTGRES_USER=stayguide -e POSTGRES_DB=stayguide \
  -p 5432:5432 postgres:16

# 2. Install deps
npm install

# 3. Configure env (defaults already work for local Postgres above)
cp .env.example .env

# 4. Push schema + seed demo data
npm run db:push
npm run db:seed

# 5. Run
npm run dev   # → http://localhost:3000
```

### Demo logins (after seeding)

| Role        | Email                      | Password      |
|-------------|----------------------------|---------------|
| Owner       | `owner@demo-tirol.test`    | `password123` |
| Manager     | `manager@demo-tirol.test`  | `password123` |
| Cleaner     | `cleaner@demo-tirol.test`  | `password123` |
| Super admin | `admin@stayguide.test`     | `password123` |

Public demo guest guide: **`/g/city-apartment-innsbruck`** (no login required).

## Roles

- **Super Admin** — platform staff; `/admin` area (tenants, users, subscriptions, logs, impersonation with audit).
- **Owner** — owns the organization; billing, team, properties, settings.
- **Manager** — manages properties, guides, messages, issues, cleaning, reports.
- **Cleaner / staff** — assigned cleaning tasks, checklists, restocking, issues.
- **Guest** — no account; opens the public guide via link/QR, searches, asks the AI, reports issues, gives feedback.

## Project layout

```
src/
  app/
    (auth)/            login, register
    onboarding/        create organization
    (app)/             authenticated host app (dashboard, properties, issues, cleaning, …)
    (admin)/           super-admin area
    (marketing)/       public landing, pricing, features (serves /)
    g/[slug]/          public guest guide (+ /report, /satisfaction, /print)
    q/[token]/         scan-tracked QR short links
    api/               route handlers (ai ask, uploads, stripe webhook, org export)
  components/
    ui/                shadcn-style primitives
    shared/ app/ guest/ + per-module folders
  lib/                 db, auth, rbac, plans, constants, ai, qr, storage, email, stripe, analytics, i18n …
  server/              "use server" action modules, one per domain
prisma/                schema.prisma + seed.ts
docs/CONVENTIONS.md    build conventions (multi-tenancy, RBAC, server actions, UI kit)
```

## Key design points

- **Tenant isolation**: every query is scoped by `organizationId` (or a property within the org).
  Org deletion cascades to all tenant data (GDPR erase); a JSON export endpoint is provided.
- **Grounded AI**: the guest assistant answers *only* from approved guide content, refuses when
  unsure, logs every Q&A, and surfaces unanswered questions + FAQ suggestions to the host.
- **Plans & limits**: `src/lib/plans.ts` defines tiers and limits (properties, team, videos, AI
  messages, storage), enforced server-side via `src/lib/usage.ts`.

See [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) for the engineering conventions and
[`STATUS.md`](STATUS.md) for what is complete vs. stubbed.

## Scripts

| Command            | Description                          |
|--------------------|--------------------------------------|
| `npm run dev`      | Dev server                           |
| `npm run build`    | `prisma generate` + production build |
| `npm run db:push`  | Push schema to the database          |
| `npm run db:seed`  | Seed demo data (wipes existing)      |
| `npm run db:studio`| Prisma Studio                        |
| `npm run typecheck`| `tsc --noEmit`                       |
