# StayGuide Pro — build status

Honest accounting of what is complete, partial, or stubbed. Verified by: `tsc --noEmit`
(0 errors), `next build` (45+ routes compile), and a runtime smoke test (all public + 25
authenticated routes return correct status codes; grounded AI, guardrails, multilingual
rendering and QR scan-tracking exercised live against the seeded DB).

## ✅ Complete & verified

**Auth, tenancy, RBAC** — register / login / logout, JWT-cookie sessions, onboarding (create org),
multi-tenant org context, org switcher, role-based permissions (OWNER / MANAGER / CLEANER),
super-admin flag. Route guards verified (unauthed → 307 `/login`).

**Properties & guide builder** — property CRUD, full property settings form, starter-section
templates, guide builder (add / reorder / hide / delete sections), section editor with **AI
drafting** and **per-locale translations** (manual + AI), publish/unpublish.

**Public guest guide** (`/g/[slug]`) — mobile-first, multilingual with base-language fallback
(verified: `?lang=de` renders German), client search, category nav, section rendering with
video/image/map media, **grounded AI chat** (verified: answers heating question with citation;
refuses out-of-scope question → "contact host"), issue reporting **with photo upload**,
satisfaction check, emergency contacts, print/PDF view, PWA manifest, SEO `noindex`, QR
scan-tracked short links (`/q/[token]` → 307).

**Operations modules** (all render with seeded data, RBAC-gated, org-scoped, audited):
Issues (workflow, assign, internal/guest comments, AI reply draft) · Cleaning (room checklists,
status flow, inspection, ready-for-next-guest, damage → issue, missing-inventory → stock) ·
Inventory & restocking · Message templates (variables, preview, copy) · Guest questions inbox +
AI FAQ suggestions · Review assistant (unresolved-issue warnings, AI drafts) · Analytics (org +
per-property, lightweight charts) · Team + email invitations + accept flow · Billing (plans,
usage bars, mock + Stripe checkout) · Organization settings + JSON data export + delete ·
Media library · QR manager (PNG/SVG/print) · Recommendations · AI settings + test console ·
Tirol/DACH content templates.

**Super admin** (`/admin`) — overview/MRR, organizations (+ impersonation w/ audit), users,
subscriptions, logs.

**Marketing** — landing, pricing, features, live demo-guide link.

**Data** — all 28+ Prisma models; seed: Demo Tirol org, 3 properties, full guide content,
QR codes, media, recommendations, inventory, cleaning, issues, questions, ~320 analytics events.

## 🟡 Works with graceful fallback (needs keys/services for "real" mode)

- **AI** — runs on a deterministic keyword-retrieval responder offline; set `OPENAI_API_KEY` for
  real LLM answers/translation/drafting (same code path).
- **Billing** — "mock" mode applies plan changes directly; set Stripe keys + price IDs for real
  Checkout. Webhook handler present (no-op without `STRIPE_WEBHOOK_SECRET`).
- **Email** — invitations/notifications log to the server console; set `RESEND_API_KEY` to send.
- **Storage** — uploads go to `public/uploads`; set S3 vars for presigned-URL uploads to S3.

## 🔧 Stubbed / not implemented (scope boundaries)

- **Scheduled message sending & background jobs** — `ScheduledMessage` model exists; templates are
  copy/preview only. No BullMQ/Inngest worker or cron yet.
- **Video processing** — no transcoding/compression/thumbnail generation; transcripts are a stored
  field (manual or AI-from-text), media referenced by URL.
- **Branded PDFs** — "Save as PDF" uses print-optimized HTML + `@media print`, not a server-side
  PDF generator.
- **Real-time** — issue/cleaning updates use request revalidation, not WebSockets/Supabase Realtime.
- **Rate limiting** — in-memory per-instance (swap for Redis/Upstash in multi-instance prod).
- **Host-side photo uploads** on issues/cleaning accept image **URLs** (the guest report has a full
  file-upload widget); wiring those panels to `@/lib/storage` is a small follow-up.
- **Per-property branding** on the public guide (logo/color override) is modeled but the guide uses
  the global theme.
- **Automated tests** — none added; verification was build + runtime smoke tests.
- **API surface** — CRUD is via Next.js Server Actions (not a public REST/tRPC API); dedicated route
  handlers exist for AI ask, uploads, QR redirect, Stripe webhook, and org export.

## Notes
- Auth is a custom JWT-cookie scheme (not NextAuth) — see `src/lib/auth.ts`.
- `scripts/smoke-auth.mjs` mints dev session cookies and pings every route (dev smoke test).
