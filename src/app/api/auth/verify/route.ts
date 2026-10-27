import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLive } from "@/i18n/config";
import { DICTS } from "@/i18n/dictionaries";
import { authClient, emailSignInReady } from "@/lib/auth";
import { limiter } from "@/lib/rate-limit";

// Checks an emailed sign-in code. If it's right, the session cookie is set.

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().max(200).pipe(z.email()),
  code: z.string().trim().regex(/^\d{6,10}$/),
});

// A handful of tries per address, so a code can't be guessed.
const tries = limiter(15 * 60_000, 8);

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
  if (!tries(email)) return fail(a.tooMany, 429);

  const { data, error } = await (await authClient()).auth.verifyOtp({ email, token: code, type: "email" });
  if (error || !data.user) return fail(a.badCode, 400);
  const meta = data.user.user_metadata ?? {};
  return NextResponse.json({ ok: true, account: { email: data.user.email ?? email, name: typeof meta.full_name === "string" ? meta.full_name : null } });
}
