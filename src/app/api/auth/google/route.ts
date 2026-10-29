import { createHash, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { GOOGLE_COOKIE, authClient, googleEnabled, safeNext } from "@/lib/auth";

// Starts signing in with Google. With the site's own Google client ID set, Google sends
// the visitor straight back to /api/auth/google/return, so Google's sign-in page names
// this site. Without it, Supabase runs the sign-in and sends them to /api/auth/callback,
// and Google's page names the Supabase project instead.
export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const back = new URL(next, req.nextUrl.origin);
  back.searchParams.set("error", "signin");
  if (!(await googleEnabled())) return NextResponse.redirect(back);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (clientId) {
    const state = randomBytes(16).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");
    const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    google.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${req.nextUrl.origin}/api/auth/google/return`,
      response_type: "id_token",
      // Google posts the sign-in back, so it never sits in an address or browser history.
      response_mode: "form_post",
      scope: "openid email profile",
      state,
      // Google puts the hash in the sign-in; Supabase checks it against the nonce itself.
      nonce: createHash("sha256").update(nonce).digest("hex"),
    }).toString();
    const res = NextResponse.redirect(google);
    // Sent back with Google's post from another site, hence SameSite=None.
    res.cookies.set(GOOGLE_COOKIE, JSON.stringify({ state, nonce, next }), {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/api/auth/google",
      maxAge: 15 * 60,
    });
    return res;
  }

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
