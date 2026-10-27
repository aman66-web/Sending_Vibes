import { NextResponse, type NextRequest } from "next/server";
import { authClient, safeNext } from "@/lib/auth";

// Google (through Supabase) sends the visitor back here with a one-time code, which
// becomes their session cookie.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  if (code) {
    const { error } = await (await authClient()).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, req.nextUrl.origin));
    console.error("Google sign-in failed", error);
  }
  const back = new URL(next, req.nextUrl.origin);
  back.searchParams.set("error", "signin");
  return NextResponse.redirect(back);
}
