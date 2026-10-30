import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLive } from "@/i18n/config";
import { DICTS } from "@/i18n/dictionaries";
import { emailSignInReady } from "@/lib/auth";
import { sendSignInCode } from "@/lib/email";
import { DAY, HOUR, allow, clientNetwork } from "@/lib/rate-limit";
import { adminSupabase } from "@/lib/storage";

// Emails a sign-in code. Supabase makes the code, and the account the first time.

const bodySchema = z.object({ email: z.string().trim().toLowerCase().max(200).pipe(z.email()) });

// Counted across every server, so nobody can fill a stranger's inbox with codes (which
// would also make real emails from the site more likely to land in spam).
const PER_ADDRESS = [{ max: 10, per: HOUR }];
const PER_EMAIL = [
  { max: 5, per: HOUR },
  { max: 12, per: DAY },
];

// One inbox, however the address is written, for counting only (the code still goes to
// the address as typed): name+anything@ is name@, and Gmail ignores dots and also
// answers to googlemail.com.
function inbox(email: string) {
  const at = email.lastIndexOf("@");
  let name = email.slice(0, at).toLowerCase().replace(/\+.*$/, "");
  let domain = email.slice(at + 1).toLowerCase();
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") name = name.replace(/\./g, "");
  return `${name}@${domain}`;
}

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
    if (error || !data.properties?.email_otp) throw error ?? new Error("No code came back");
    await sendSignInCode(email, data.properties.email_otp, locale);
    // How long the code is, so the sign-in box can check it as soon as it's all typed.
    return NextResponse.json({ ok: true, digits: data.properties.email_otp.length });
  } catch (e) {
    console.error("Sign-in code failed", e);
    return fail(a.codeFailed, 500);
  }
}
