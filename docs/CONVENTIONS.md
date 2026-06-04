# StayGuide Pro — build conventions (read before adding a module)

Production multi-tenant SaaS. Next.js 15 App Router, TypeScript (strict), Tailwind +
shadcn-style UI, Prisma + PostgreSQL. The **foundation already exists** — reuse it, don't
recreate it. Match the patterns in `src/server/properties.ts` and `src/server/guide.ts`.

## Golden rules for module agents
- **Own only your assigned paths.** Create new files there. Do NOT edit shared/foundation
  files (`src/lib/*`, `src/components/ui/*`, `src/components/shared/*`, `src/components/app/*`,
  `src/lib/nav.ts`, `prisma/*`, `src/app/layout.tsx`, the `(app)` layout, or another module's files).
- **Nav is already wired** in `src/lib/nav.ts` and `PROPERTY_NAV`. Just create the pages at the
  listed routes. Don't touch nav.
- **Do NOT run** `npm`, `tsc`, `next build`, or migrations. Just write code. Typecheck is central.
- Keep imports to the `@/` alias. TS is strict — type everything; no `any` unless unavoidable.

## Tenancy & auth (`@/lib/auth`)
- `await requireOrg()` → `{ session, user, organization (incl. subscription), membership, role }`.
- `await requireRole(["OWNER","MANAGER"])` → same, redirects if role not allowed.
- `await requireSuperAdmin()` for `/admin`.
- **Always scope queries by `organizationId`** (or `propertyId` whose property is in the org).
  Never trust an id from the client without an org-scoped `findFirst`.

## RBAC (`@/lib/rbac`)
`can(role, permission)` with permissions like `issues:manage`, `cleaning:complete`,
`inventory:report`, `members:manage`, `billing:manage`, `analytics:view`, etc. (see file).
Roles: `OWNER` > `MANAGER` > `CLEANER`. Gate UI actions with `can(...)`.

## Server actions (`src/server/<module>.ts`, top line `"use server";`)
```ts
export type State = { error?: string; success?: boolean } | undefined;
export async function doThing(_prev: State, formData: FormData): Promise<State> {
  const ctx = await requireRole(["OWNER","MANAGER"]);
  // validate with zod; org-scope a findFirst; mutate; audit(); revalidatePath(); return {success:true}
}
```
- Use `revalidatePath(...)` after mutations. Use `redirect(...)` for navigation.
- Record important actions with `audit({ action, organizationId, actorUserId, targetType, targetId })`.
- Record metrics with `trackEvent({ organizationId, propertyId, type, ... })` from `@/lib/analytics`.

## Client forms
`"use client"` + `useActionState(action, undefined)` + `<SubmitButton>` from
`@/components/shared/submit-button`. Show `state.error`. For success toasts use
`useToast()` from `@/components/ui/use-toast`. Next 15: `params`/`searchParams` are Promises
(`await params`); `cookies()` is async.

## UI kit (import from `@/components/ui/<name>`)
button, card (Card/CardHeader/CardTitle/CardDescription/CardContent/CardFooter), input, textarea,
label, badge, select (Select/SelectTrigger/SelectValue/SelectContent/SelectItem), dialog,
dropdown-menu, popover, tabs, switch, checkbox, separator, avatar, progress, table
(Table/TableHeader/TableBody/TableRow/TableHead/TableCell), tooltip, sheet, toast, skeleton.
Shared: `@/components/shared/{page-header,empty-state,stat-card,copy-button,submit-button,section-icon}`.
Icons: `lucide-react`. Class helper: `cn` from `@/lib/utils`.

## Look & feel
- Use a `<PageHeader title description>{actions}</PageHeader>` at the top of each app page.
- Tailwind tokens: `bg-primary text-primary-foreground`, `bg-muted text-muted-foreground`,
  `bg-card`, `border`, `bg-destructive`, `bg-success`, `bg-warning`. Radius via `rounded-lg/xl`.
- Use `<StatCard>` for metrics, `<EmptyState>` when lists are empty. Responsive, mobile-friendly.

## Helpers & data
- `@/lib/constants`: `LOCALES`, `LOCALE_LABELS`, `SECTION_TYPES`, `ISSUE_CATEGORY_LABELS`,
  `RECOMMENDATION_CATEGORY_LABELS`, `MESSAGE_TYPE_LABELS`, `QR_CODE_LABELS`,
  `DEFAULT_INVENTORY_ITEMS`, `DEFAULT_CLEANING_CHECKLIST`.
- `@/lib/plans`: `PLANS`, `planHasCapability(tier, cap)`, `getPlanLimits`. Gate premium features.
- `@/lib/usage`: `canCreateProperty`, `canInviteMember`, etc. (limit checks).
- `@/lib/messages`: `renderTemplate(body, vars)`, `buildMessageVariables(property, stay)`.
- `@/lib/qr`: `qrShortUrl(token)`, `generateQrDataUrl(text)`, `generateQrSvg(text)`.
- `@/lib/ai`: grounded `answerGuestQuestion`, `generateGuideDraft`, `translateContent`,
  `suggestFaqs`, `summarizeIssue`, `draftGuestReply`, `draftReviewRequest`. All have offline fallbacks.
- `@/lib/email`: `sendEmail` (logs to console when unconfigured).
- `@/lib/stripe`: `createCheckoutSession`, `createBillingPortalSession`, `billingMode` ("mock"|"stripe").
- `@/lib/storage`: `createUploadTarget(key, contentType)` → S3 presigned or local `/api/upload`.

## Prisma models
See `prisma/schema.prisma`. Key: Organization, Property, GuideSection, GuideMedia, Translation,
QRCode, GuestQuestion, AIAnswerLog, MessageTemplate, ScheduledMessage, GuestStay,
SatisfactionCheck, Issue, IssueComment, CleaningChecklistTemplate, CleaningChecklistItem,
CleaningTask, CleaningTaskItem, InventoryItem, RestockTask, Recommendation, ReviewRequest,
AnalyticsEvent, AuditLog, AdminSetting, Subscription, OrganizationMember, Invitation, User.
Import `db` from `@/lib/db`; enums/types from `@prisma/client`.
