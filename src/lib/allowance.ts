import "server-only";
import type { Account } from "./auth";
import { ordersFor } from "./orders";
import { logEvent } from "./log";
import { adminSupabase, usingSupabase } from "./storage";

// How much each account can use the AI, so the AI can never cost more than people pay.
// Everyone starts with a few new cards (written from their answers) and typed changes,
// and every card they buy adds more. A daily ceiling slows down anyone trying to use it
// all at once. Changing things by hand doesn't use the AI, so it's free and unlimited.
// Counted in the database, so it holds across devices and servers.

export const ALLOWANCE = {
  start: { card: 3, change: 30 },
  perCardBought: { card: 3, change: 30 },
  perDay: { card: 10, change: 60 },
};

export type Kind = keyof typeof ALLOWANCE.start;
// What's left, and if none, whether it's the total (buy a card for more) or today's ceiling.
export type Left = { left: number; total: number; reason: "total" | "day" };

const DAY_MS = 24 * 60 * 60_000;

// Without Supabase (working on the site locally) it's kept in memory.
const local = new Map<string, number[]>();

function db() {
  const client = adminSupabase();
  if (!client) throw new Error("SUPABASE_SECRET_KEY is not set");
  return client.from("ai_usage");
}

async function cardsBought(account: Account) {
  return (await ordersFor(account)).reduce((n, order) => n + order.items.length, 0);
}

async function used(account: Account, kind: Kind, since = 0) {
  if (!usingSupabase()) return (local.get(`${account.id}:${kind}`) ?? []).filter((t) => t > since).length;
  let query = db().select("id", { count: "exact", head: true }).eq("user_id", account.id).eq("kind", kind);
  if (since) query = query.gte("created_at", new Date(since).toISOString());
  const { count, error } = await query;
  if (error) throw new Error(`Could not check the allowance: ${error.message}`);
  return count ?? 0;
}

// What's left from the total they've earned, having used `ever` in all and `today` in the last day.
function leftOf(kind: Kind, total: number, ever: number, today: number): Left {
  const fromTotal = total - ever;
  const fromDay = ALLOWANCE.perDay[kind] - today;
  return { left: Math.max(Math.min(fromTotal, fromDay), 0), total, reason: fromTotal <= fromDay ? "total" : "day" };
}

const earned = async (account: Account, kind: Kind) => ALLOWANCE.start[kind] + (await cardsBought(account)) * ALLOWANCE.perCardBought[kind];

export async function allowanceLeft(account: Account, kind: Kind): Promise<Left> {
  const [total, ever, today] = await Promise.all([earned(account, kind), used(account, kind), used(account, kind, Date.now() - DAY_MS)]);
  return leftOf(kind, total, ever, today);
}

// Counts one use before the AI starts, so many at once can't all slip through.
// Returns a way to give it back if the AI then fails.
// It doesn't check what's left: claim() below checks and counts in one step.
export async function spend(account: Account, kind: Kind): Promise<() => Promise<void>> {
  if (!usingSupabase()) {
    const key = `${account.id}:${kind}`;
    const time = Date.now();
    local.set(key, [...(local.get(key) ?? []), time]);
    return async () => void local.set(key, (local.get(key) ?? []).filter((t) => t !== time));
  }
  const { data, error } = await db().insert({ user_id: account.id, kind }).select("id").single();
  if (error) throw new Error(`Could not count the use: ${error.message}`);
  return giveBack(data.id);
}

const giveBack = (id: number) => async () => {
  await db().delete().eq("id", id);
};

// Either one use taken (with what's left after it, and a way to give it back if the AI
// fails), or none left and why.
export type Claim = { ok: true; left: number; refund: () => Promise<void> } | ({ ok: false } & Left);

// Checks what's left and takes one use in a single step, so two requests at once can never
// both take the last one (the database locks each account while it counts; see
// supabase/migrations/0009_rate_limits.sql). Until that migration is applied it falls
// back to checking then spending, as before.
export async function claim(account: Account, kind: Kind): Promise<Claim> {
  const total = await earned(account, kind);
  if (!usingSupabase()) {
    // Nothing awaits between the check and the count, so this is one step too.
    const key = `${account.id}:${kind}`;
    const time = Date.now();
    const times = local.get(key) ?? [];
    const left = leftOf(kind, total, times.length, times.filter((t) => t > time - DAY_MS).length);
    if (left.left <= 0) return { ok: false, ...left };
    local.set(key, [...times, time]);
    return { ok: true, left: left.left - 1, refund: async () => void local.set(key, (local.get(key) ?? []).filter((t) => t !== time)) };
  }
  const client = adminSupabase();
  if (!client) throw new Error("SUPABASE_SECRET_KEY is not set");
  const { data, error } = await client.rpc("spend_ai", { uid: account.id, k: kind, total, per_day: ALLOWANCE.perDay[kind] });
  if (error) {
    if (error.code !== "PGRST202" && error.code !== "42883") throw new Error(`Could not use the allowance: ${error.message}`);
    logEvent("allowance_fallback", { reason: "spend_ai is missing: apply migration 0009" }, "warn");
    const left = await allowanceLeft(account, kind);
    if (left.left <= 0) return { ok: false, ...left };
    return { ok: true, left: left.left - 1, refund: await spend(account, kind) };
  }
  const result = data as { id: number | null; ever: number; today: number } | null;
  if (typeof result?.ever !== "number" || typeof result.today !== "number") throw new Error("Could not use the allowance: unexpected reply");
  const left = leftOf(kind, total, result.ever, result.today);
  if (result.id === null || result.id === undefined) return { ok: false, ...left };
  return { ok: true, left: Math.max(left.left - 1, 0), refund: giveBack(result.id) };
}
