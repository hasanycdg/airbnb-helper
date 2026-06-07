import "server-only";
import { Resend } from "resend";
import { env, features } from "@/lib/env";

let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!features.email) return null;
  if (!resend) resend = new Resend(env.email.resendApiKey);
  return resend;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  /** Address replies should go to (e.g. the host who sent a support request). */
  replyTo?: string;
}

export interface EmailResult {
  sent: boolean;
  mock: boolean;
  error?: string;
}

/**
 * Address that host support requests are delivered to. Uses SUPPORT_EMAIL when
 * set, otherwise parses the address out of EMAIL_FROM
 * ("Name <addr@host>" → "addr@host"). Server-only (reads env).
 */
export function supportInbox(): string {
  if (env.email.supportEmail) return env.email.supportEmail.trim();
  const m = env.email.from.match(/<([^>]+)>/);
  return (m ? m[1] : env.email.from).trim();
}

/**
 * Sends an email via Resend when configured, otherwise logs it to the server
 * console (so flows like invitations and scheduled messages work in dev).
 *
 * NOTE: the Resend SDK does NOT throw when the API rejects a send (e.g. an
 * unverified sending domain); it returns an `{ error }` object. We surface that
 * as `{ sent: false, error }` so callers can tell the user the truth instead of
 * falsely reporting success.
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const client = getResend();
  if (!client) {
    console.info("[email:mock] →", message.to, "·", message.subject);
    if (message.text) console.info(message.text);
    return { sent: true, mock: true };
  }
  try {
    const { error } = await client.emails.send({
      from: env.email.from,
      to: message.to,
      subject: message.subject,
      html: message.html ?? message.text ?? "",
      text: message.text,
      ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    });
    if (error) {
      const msg = error.message ?? "Resend rejected the send.";
      console.error("[email] Resend rejected the send:", msg);
      return { sent: false, mock: false, error: msg };
    }
    return { sent: true, mock: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown email error";
    console.error("[email] send threw:", msg);
    return { sent: false, mock: false, error: msg };
  }
}
