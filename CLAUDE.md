# StayGuide Pro — notes for Claude

Multi-tenant SaaS (digital guest guides + property ops) for vacation-rental hosts.
**Stack:** Next.js 15 App Router + TS (strict), Tailwind + shadcn-style UI, Prisma + Postgres.

## Running locally
- Postgres runs in Docker (`stayguide-pg`, port 5432). `DATABASE_URL` is in `.env`.
- `npm run dev` to start; `npm run db:push` + `npm run db:seed` to (re)seed.
- Demo owner: `owner@demo-tirol.test` / `password123`. Public guide: `/g/city-apartment-innsbruck`.
- All external integrations (OpenAI/Stripe/Resend/S3) are **optional** with offline fallbacks — the app runs with no keys.

## Where things live
- Shared infra: `src/lib/*` (db, auth, rbac, plans, constants, ai, qr, storage, email, stripe, analytics, usage, i18n).
- Server actions: `src/server/<domain>.ts` (`"use server"`). UI kit: `src/components/ui/*`.
- Routes: `(app)` = host app (org-scoped), `(admin)` = super admin, `(marketing)` = public, `g/[slug]` = guest guide.
- Engineering conventions: **`docs/CONVENTIONS.md`** (read before adding a feature).

## Conventions (short)
- Always `await requireOrg()` / `requireRole([...])` in app pages; **scope every query by `organizationId`**.
- RBAC via `can(role, permission)` (`src/lib/rbac.ts`). Plan gating via `planHasCapability` / `src/lib/usage.ts`.
- Next 15: `params`/`searchParams` are Promises; `cookies()` is async.
- Client forms: `useActionState` + `<SubmitButton>` + `useToast`.

## Conventions / gotchas
- Auth is a **custom JWT-cookie** scheme (`jose` + `bcryptjs`), not NextAuth — see `src/lib/auth.ts`.
- `next build` runs `prisma generate` first (see `package.json`). ESLint is not run during build.
- Translations are polymorphic (`Translation` model: entityType+entityId+field+locale).
