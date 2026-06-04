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
}

/**
 * Sends an email via Resend when configured, otherwise logs it to the server
 * console (so flows like invitations and scheduled messages work in dev).
 */
export async function sendEmail(message: EmailMessage): Promise<{ sent: boolean; mock: boolean }> {
  const client = getResend();
  if (!client) {
    console.info("[email:mock] →", message.to, "·", message.subject);
    if (message.text) console.info(message.text);
    return { sent: true, mock: true };
  }
  await client.emails.send({
    from: env.email.from,
    to: message.to,
    subject: message.subject,
    html: message.html ?? message.text ?? "",
    text: message.text,
  });
  return { sent: true, mock: false };
}
