import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Signing in is Supabase Auth with Google, done entirely on the server: the session
// lives in cookies that our API routes read, so every page can stay static.

export type Account = { id: string; email: string | null; name: string | null };

export function authReady() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}

export async function authClient() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) store.set(name, value, options);
      },
    },
  });
}

// The signed-in visitor, checked with Supabase, or null.
export async function currentAccount(): Promise<Account | null> {
  if (!authReady()) return null;
  const { data } = await (await authClient()).auth.getUser();
  const user = data.user;
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    // Only a confirmed address is used to find someone's orders.
    email: user.email && user.email_confirmed_at ? user.email : null,
    name: typeof meta.full_name === "string" ? meta.full_name : typeof meta.name === "string" ? meta.name : null,
  };
}

let google: { on: boolean; checked: number } | undefined;

// Whether Google sign-in is switched on in Supabase. Checked at most every few minutes.
export async function googleEnabled() {
  if (!authReady()) return false;
  if (google && Date.now() - google.checked < 5 * 60_000) return google.on;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY! }, cache: "no-store" });
    const json = await res.json();
    google = { on: Boolean(json?.external?.google), checked: Date.now() };
  } catch {
    google = { on: false, checked: Date.now() };
  }
  return google.on;
}

// Only ever send people back to a page on this site.
export function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/account";
}
