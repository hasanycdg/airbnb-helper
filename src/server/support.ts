"use server";

import { z } from "zod";
import { requireOrg } from "@/lib/auth";
import { sendEmail, supportInbox } from "@/lib/email";
import { env } from "@/lib/env";
import { SUPPORT_CATEGORIES, type SupportActionState } from "@/lib/support";

const schema = z.object({
  category: z.enum(SUPPORT_CATEGORIES),
  message: z.string().trim().min(10, "Bitte beschreibe dein Anliegen (mind. 10 Zeichen)."),
});

export async function sendSupportMessage(
  _prev: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  const ctx = await requireOrg();

  const parsed = schema.safeParse({
    category: formData.get("category"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const to = supportInbox();
  if (!to || !to.includes("@")) {
    return { error: "Support-Adresse ist nicht konfiguriert (SUPPORT_EMAIL setzen)." };
  }

  const { category, message } = parsed.data;
  const fromName = ctx.user.name ?? "—";

  const res = await sendEmail({
    to,
    replyTo: ctx.user.email,
    subject: `[Support · ${category}] ${ctx.organization.name}`,
    text: [
      `Neue Support-Anfrage über StayGuide Pro`,
      ``,
      `Von:    ${fromName} <${ctx.user.email}>`,
      `Rolle:  ${ctx.role}`,
      `Org:    ${ctx.organization.name} (${ctx.organization.id})`,
      `Thema:  ${category}`,
      ``,
      `Nachricht:`,
      message,
      ``,
      `— ${env.appUrl}`,
    ].join("\n"),
  });

  if (!res.sent) {
    return {
      error: `Senden fehlgeschlagen (${res.error ?? "unbekannt"}). Schreib uns bitte direkt per E-Mail.`,
    };
  }

  return { success: true };
}
