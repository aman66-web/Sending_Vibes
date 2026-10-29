import { createHmac } from "node:crypto";
import { logEvent } from "./log";
import { adminSupabase } from "./storage";

// A simple in-memory limit on how often something can happen per key (an IP address, an
// email address). It resets when the server restarts, so it's a brake, not a wall.
export function limiter(windowMs: number, max: number) {
  const recent = new Map<string, number[]>();
  return (key: string) => {
    const now = Date.now();
    const times = (recent.get(key) ?? []).filter((t) => now - t < windowMs);
    if (times.length >= max) return false;
    times.push(now);
    recent.set(key, times);
    if (recent.size > 5000) {
      for (const [k, list] of recent) if (list.every((t) => now - t >= windowMs)) recent.delete(k);
    }
    return true;
  };
}

export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
}

// The visitor's address for limits. A phone or home router on IPv6 gets a whole block of
// addresses (a /64), so those count as one, or one person could just pick a new address.
export function clientNetwork(headers: Headers) {
  const ip = clientIp(headers).replace(/%.*$/, "");
  if (!ip.includes(":")) return ip;
  const v4 = /(\d{1,3}(?:\.\d{1,3}){3})$/.exec(ip);
  if (v4) return v4[1];
  const [head, tail] = ip.split("::");
  const front = head ? head.split(":") : [];
  const back = tail !== undefined ? (tail ? tail.split(":") : []) : [];
  const groups = [...front, ...Array<string>(Math.max(8 - front.length - back.length, 0)).fill("0"), ...back];
  return groups.slice(0, 4).map((g) => g.toLowerCase().replace(/^0+(?=.)/, "")).join(":") + "::/64";
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

// At most `max` times in any `per` milliseconds. Keep `per` to a day at most.
export type Rule = { max: number; per: number };

// Whether `who` (an address, an email) may do `name` again, counting this time if so.
// Counted in the database (supabase/migrations/0009_rate_limits.sql), so it holds across
// every server. Until that's set up, or if the database is slow or down, each server
// counts in memory instead: a database problem never stops someone making a card.
export async function allow(name: string, who: string, rules: Rule[]): Promise<boolean> {
  // Hashed with the secret key, so the table never holds a readable address or email.
  const secret = process.env.SUPABASE_SECRET_KEY ?? "";
  const key = `${name}:${createHmac("sha256", secret).update(who.trim().toLowerCase()).digest("base64url").slice(0, 27)}`;
  const db = adminSupabase();
  if (!db || Date.now() < skipDbUntil) return inMemory(key, rules);
  try {
    const { data, error } = await db
      .rpc("rate_hit", { k: key, window_seconds: rules.map((r) => Math.ceil(r.per / 1000)), max_hits: rules.map((r) => r.max) })
      .abortSignal(AbortSignal.timeout(2000));
    if (error) throw error;
    return data !== false;
  } catch (e) {
    const code = (e as { code?: string }).code;
    // The migration isn't applied yet, or the database is down: stop asking for a while
    // rather than making every request wait.
    const missing = code === "PGRST202" || code === "42883" || code === "42P01";
    skipDbUntil = Date.now() + (missing ? 10 * MINUTE : 30_000);
    if (Date.now() - lastWarned > MINUTE) {
      lastWarned = Date.now();
      logEvent("rate_limit_fallback", { name, code, error: e instanceof Error ? e.message : (e as { message?: string }).message }, "warn");
    }
    return inMemory(key, rules);
  }
}

let skipDbUntil = 0;
let lastWarned = 0;
const memory = new Map<string, number[]>();

function inMemory(key: string, rules: Rule[]) {
  const now = Date.now();
  const longest = Math.max(...rules.map((r) => r.per));
  const times = (memory.get(key) ?? []).filter((t) => now - t < longest);
  const full = rules.some((r) => times.filter((t) => now - t < r.per).length >= r.max);
  if (!full) times.push(now);
  memory.set(key, times);
  if (memory.size > 5000) {
    for (const [k, list] of memory) if (!list.length || now - list[list.length - 1] >= DAY) memory.delete(k);
  }
  return !full;
}
