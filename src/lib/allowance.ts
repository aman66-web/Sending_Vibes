import "server-only";
import type { Account } from "./auth";
import { ordersFor } from "./orders";
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

export async function allowanceLeft(account: Account, kind: Kind): Promise<Left> {
  const [bought, ever, today] = await Promise.all([cardsBought(account), used(account, kind), used(account, kind, Date.now() - DAY_MS)]);
  const total = ALLOWANCE.start[kind] + bought * ALLOWANCE.perCardBought[kind];
  const fromTotal = total - ever;
  const fromDay = ALLOWANCE.perDay[kind] - today;
  return { left: Math.max(Math.min(fromTotal, fromDay), 0), total, reason: fromTotal <= fromDay ? "total" : "day" };
}

// Counts one use before the AI starts, so many at once can't all slip through.
// Returns a way to give it back if the AI then fails.
export async function spend(account: Account, kind: Kind): Promise<() => Promise<void>> {
  if (!usingSupabase()) {
    const key = `${account.id}:${kind}`;
    const time = Date.now();
    local.set(key, [...(local.get(key) ?? []), time]);
    return async () => void local.set(key, (local.get(key) ?? []).filter((t) => t !== time));
  }
  const { data, error } = await db().insert({ user_id: account.id, kind }).select("id").single();
  if (error) throw new Error(`Could not count the use: ${error.message}`);
  return async () => {
    await db().delete().eq("id", data.id);
  };
}
