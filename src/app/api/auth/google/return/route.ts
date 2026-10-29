import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { GOOGLE_COOKIE, authClient, safeNext } from "@/lib/auth";

// Google posts the visitor's sign-in here (see /api/auth/google). Supabase checks it and
// it becomes their session cookie, then they go back to where they were.

const savedSchema = z.object({ state: z.string().min(1), nonce: z.string().min(1), next: z.string() });

export async function POST(req: NextRequest) {
  let saved: z.infer<typeof savedSchema> | null = null;
  try {
    saved = savedSchema.parse(JSON.parse(req.cookies.get(GOOGLE_COOKIE)?.value ?? ""));
  } catch {}
  const next = safeNext(saved?.next ?? null);
  // 303 so the browser goes on with a GET, not another post.
  const go = (to: URL) => {
    const res = NextResponse.redirect(to, 303);
    res.cookies.delete({ name: GOOGLE_COOKIE, path: "/api/auth/google" });
    return res;
  };
  const back = new URL(next, req.nextUrl.origin);
  back.searchParams.set("error", "signin");

  const form = await req.formData().catch(() => null);
  const token = form?.get("id_token");
  // The state ties Google's answer to the sign-in this browser started. Without a token
  // they cancelled, or Google said no.
  if (!saved || form?.get("state") !== saved.state || typeof token !== "string") return go(back);

  const { error } = await (await authClient()).auth.signInWithIdToken({ provider: "google", token, nonce: saved.nonce });
  if (error) {
    console.error("Google sign-in failed", error);
    return go(back);
  }
  return go(new URL(next, req.nextUrl.origin));
}
