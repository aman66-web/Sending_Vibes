import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLive } from "@/i18n/config";
import { DICTS } from "@/i18n/dictionaries";
import type { EmailOtpType } from "@supabase/supabase-js";
import { authClient, emailSignInReady } from "@/lib/auth";
import { DAY, MINUTE, allow } from "@/lib/rate-limit";
import { CODE_COOKIE, inbox, unseal } from "@/lib/signin-code";

// Checks an emailed sign-in code against the sealed sign-in waiting in this browser
// (lib/signin-code.ts). If it's right, Supabase signs them in and the session cookie is set.
// A code from before the site made its own (Supabase's, 8 digits) still works for its hour.

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().max(200).pipe(z.email()),
  code: z.string().trim().regex(/^\d{6,10}$/),
});

// A handful of tries per inbox, counted across every server, so a code can't be guessed.
const TRIES = [
  { max: 8, per: 15 * MINUTE },
  { max: 30, per: DAY },
];

export async function POST(req: NextRequest) {
  const lang = req.cookies.get(LOCALE_COOKIE)?.value;
  const a = DICTS[isLive(lang) ? lang : DEFAULT_LOCALE].account;
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

  const origin = req.headers.get("origin");
  if (origin && (!URL.canParse(origin) || new URL(origin).host !== req.headers.get("host"))) return fail(a.badCode, 403);
  if (!emailSignInReady()) return fail(a.off, 503);
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(a.badCode, 400);
  const { email, code } = parsed.data;
  if (!(await allow("signin-verify", inbox(email), TRIES))) return fail(a.tooMany, 429);

  const auth = (await authClient()).auth;
  const ticket = unseal(req.cookies.get(CODE_COOKIE)?.value, email, code);
  const { data, error } = ticket ? await auth.verifyOtp({ token_hash: ticket.tokenHash, type: ticket.type as EmailOtpType }) : await auth.verifyOtp({ email, token: code, type: "email" });
  if (error || !data.user) return fail(a.badCode, 400);
  const meta = data.user.user_metadata ?? {};
  const res = NextResponse.json({ ok: true, account: { email: data.user.email ?? email, name: typeof meta.full_name === "string" ? meta.full_name : null } });
  // Used up: the same code can't sign anyone in again.
  if (ticket) res.cookies.set(CODE_COOKIE, "", { path: "/api/auth", maxAge: 0 });
  return res;
}
