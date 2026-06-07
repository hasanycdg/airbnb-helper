// Pure, client-safe support constants & types. No env / server imports here so
// this can be imported from both the support form (client) and the action
// (server). The server-only inbox resolver lives in `@/lib/email`.

export const SUPPORT_CATEGORIES = ["bug", "question", "feature", "billing", "other"] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export type SupportActionState = { error?: string; success?: boolean } | undefined;
