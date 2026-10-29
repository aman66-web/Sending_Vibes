import "server-only";
import { Resend } from "resend";
import { logEvent, scrub } from "./log";
import { MINUTE, allow } from "./rate-limit";

// Emails the owner when something on the way to being paid breaks (a checkout, Stripe's
// webhook, an order's emails), so it doesn't sit unnoticed in the logs. Off unless
// OWNER_ALERT_EMAIL is set (and email is set up: RESEND_API_KEY and EMAIL_FROM).
// One email per kind of problem every half hour at most; the rest are in the logs.
// Only ids and what went wrong go in it, never anyone's name or email address.
// Never throws, so it's safe to call from anywhere.
export async function alertOwner(subject: string, fields: Record<string, string | number | undefined> = {}) {
  logEvent("owner_alert", { subject, ...fields }, "error");
  const to = process.env.OWNER_ALERT_EMAIL?.split(",").map((s) => s.trim()).filter(Boolean);
  const from = process.env.EMAIL_FROM;
  if (!to?.length || !from || !process.env.RESEND_API_KEY) return;
  try {
    if (!(await allow("owner-alert", subject, [{ max: 1, per: 30 * MINUTE }]))) return;
    const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date());
    const details = Object.entries(fields)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => `  ${key}: ${scrub(String(value)).slice(0, 500)}`);
    const text = [
      "Something went wrong on the site that needs a look.",
      "",
      `What: ${subject}`,
      `When: ${when} (UK time)`,
      ...(details.length ? ["Details:", ...details] : []),
      "",
      "For more, open the project on Vercel, go to Logs and search for the details above.",
      "You'll get at most one of these emails every 30 minutes for the same problem, so there may be more in the logs.",
    ].join("\n");
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from, to, subject: `Envelette alert: ${subject}`, text });
    if (error) throw new Error(error.message);
  } catch (e) {
    logEvent("owner_alert_failed", { subject, error: e instanceof Error ? e.message : String(e) }, "error");
  }
}
