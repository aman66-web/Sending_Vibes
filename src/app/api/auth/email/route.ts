import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLive } from "@/i18n/config";
import { DICTS } from "@/i18n/dictionaries";
import { emailSignInReady } from "@/lib/auth";
import { sendSignInCode } from "@/lib/email";
import { clientIp, limiter } from "@/lib/rate-limit";
import { adminSupabase } from "@/lib/storage";

// Emails a sign-in code. Supabase makes the code, and the account the first time.

const bodySchema = z.object({ email: z.string().trim().toLowerCase().max(200).pipe(z.email()) });

const perIp = limiter(60 * 60_000, 10);
const perEmail = limiter(60 * 60_000, 5);

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
  if (!perIp(clientIp(req.headers)) || !perEmail(email)) return fail(a.tooMany, 429);

  try {
    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (error || !data.properties?.email_otp) throw error ?? new Error("No code came back");
    await sendSignInCode(email, data.properties.email_otp, locale);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Sign-in code failed", e);
    return fail(a.codeFailed, 500);
  }
}
