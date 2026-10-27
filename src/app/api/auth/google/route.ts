import { NextResponse, type NextRequest } from "next/server";
import { authClient, googleEnabled, safeNext } from "@/lib/auth";

// Starts signing in with Google, then Supabase sends the visitor to /api/auth/callback.
export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const back = new URL(next, req.nextUrl.origin);
  back.searchParams.set("error", "signin");
  if (!(await googleEnabled())) return NextResponse.redirect(back);
  const supabase = await authClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${req.nextUrl.origin}/api/auth/callback?next=${encodeURIComponent(next)}`, skipBrowserRedirect: true },
  });
  if (error || !data.url) {
    console.error("Google sign-in failed to start", error);
    return NextResponse.redirect(back);
  }
  return NextResponse.redirect(data.url);
}
