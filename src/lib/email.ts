import { Resend } from "resend";

// Transactional email via Resend. EMAIL_DRY_RUN=1 (or no RESEND_API_KEY outside production) logs
// emails instead of sending them; in production a missing key is an error so emails can't vanish.

// Until you verify a domain in Resend, only its sandbox sender works, and it can only reach your
// own Resend account email. Set EMAIL_FROM (e.g. "Alberbts <orders@yourdomain.com>") once verified.
const DEFAULT_FROM = "Alberbts <onboarding@resend.dev>";

export const emailFrom = () => process.env.EMAIL_FROM || DEFAULT_FROM;

// True once a real sender is configured. Used to require email verification at sign-in.
export const hasVerifiedSender = () => Boolean(process.env.EMAIL_FROM);

let client: Resend | undefined;

export async function sendEmail(message: { to: string; subject: string; html: string; text: string }) {
  const key = process.env.RESEND_API_KEY;
  const dryRun = process.env.EMAIL_DRY_RUN === "1";
  if (dryRun || !key) {
    if (!dryRun && process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not set");
    console.log(`[email not sent] to=${message.to} subject="${message.subject}"\n${message.text}\n[/email]`);
    return;
  }

  const { error } = await (client ??= new Resend(key)).emails.send({ from: emailFrom(), ...message });
  if (error) throw new Error(`Resend rejected the email: ${error.name}: ${error.message}`);
}
