import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLive } from "@/i18n/config";
import { DICTS } from "@/i18n/dictionaries";
import { emailSignInReady } from "@/lib/auth";
import { sendSignInCode } from "@/lib/email";
import { DAY, HOUR, allow, clientNetwork } from "@/lib/rate-limit";
import { CODE_COOKIE, CODE_DIGITS, CODE_TTL_S, inbox, newCode, seal } from "@/lib/signin-code";
import { adminSupabase } from "@/lib/storage";

// Emails a sign-in code. Supabase makes the sign-in (and the account the first time); the
// site makes the 6-digit code and seals the two together in a cookie (lib/signin-code.ts).

const bodySchema = z.object({ email: z.string().trim().toLowerCase().max(200).pipe(z.email()) });

// Counted across every server, so nobody can fill a stranger's inbox with codes (which
// would also make real emails from the site more likely to land in spam).
const PER_ADDRESS = [{ max: 10, per: HOUR }];
const PER_EMAIL = [
  { max: 5, per: HOUR },
  { max: 12, per: DAY },
];

export async function POST(req: NextRequest) {
  const lang = req.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLive(lang) ? lang : DEFAULT_LOCALE;
  const a = DICTS[locale].account;
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

  const origin = req.headers.get("origin");
  if (origin && (!URL.canParse(origin) || new URL(origin).host !== req.headers.get("host"))) return fail(a.codeFailed, 403);
  const admin = adminSupabase();
  if (!emailSignInReady() || !admin) return fail(a.off, 503);
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(a.badEmail, 400);
  const { email } = parsed.data;
  if (!(await allow("signin-ip", clientNetwork(req.headers), PER_ADDRESS)) || !(await allow("signin-email", inbox(email), PER_EMAIL))) return fail(a.tooMany, 429);

  try {
    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (error || !data.properties?.hashed_token) throw error ?? new Error("No sign-in came back");
    const code = newCode();
    await sendSignInCode(email, code, locale);
    // How long the code is, so the sign-in box can check it as soon as it's all typed.
    const res = NextResponse.json({ ok: true, digits: CODE_DIGITS });
    res.cookies.set(CODE_COOKIE, seal({ email, tokenHash: data.properties.hashed_token, type: data.properties.verification_type, code }), {
      httpOnly: true,
      secure: req.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: CODE_TTL_S,
    });
    return res;
  } catch (e) {
    console.error("Sign-in code failed", e);
    return fail(a.codeFailed, 500);
  }
}
