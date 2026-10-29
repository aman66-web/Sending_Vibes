import { fmt } from "@/i18n/config";
import type { Dict } from "@/i18n/en";
import { MAX_SCHEDULE_DAYS } from "./basket";
import type { Order, OrderItem } from "./orders";

// The plain rules for getting a paid card to the person it's for: which emails an order
// still needs, what Resend's errors mean, and what to tell the buyer. Nothing here sends
// anything, so it can be used anywhere (and tested on its own).

// What happened to one email. `retry` says a failure is worth another go (an outage or a
// limit) rather than final (an address Resend won't take).
export type EmailResult = { at: string; ok: boolean; error?: string; retry?: boolean };

// How a paid card is reaching them, as the buyer sees it.
export type CardStatus = "self" | "emailed" | "scheduled" | "failed" | "retrying";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Resend's statuses for a request it will never accept as it is: a bad address, a field it
// won't take. Anything else (an outage, a daily limit, a key that needs fixing) can be retried.
const FINAL = new Set([400, 422, 451]);

export function isFinal(error: { name?: string; statusCode?: number | null }) {
  // A clash over the idempotency key means a copy may be on its way: never count it as given up.
  if (error.name === "invalid_idempotent_request" || error.name === "concurrent_idempotent_requests") return false;
  return error.statusCode != null && FINAL.has(error.statusCode);
}

// Settled: sent, or refused for good. Either way there's nothing more to try.
const settled = (result?: EmailResult) => !!result && (result.ok || !result.retry);

const wantsEmail = (item: OrderItem) => item.delivery === "email" && !!item.email;

// The emails an order still needs: each card we're emailing that Resend hasn't taken yet,
// and the buyer's receipt if it hasn't reached them.
export function pending(order: Pick<Order, "items" | "buyerEmail">) {
  return {
    cards: order.items.filter((item) => wantsEmail(item) && !settled(item.cardEmail)),
    receipt: !!order.buyerEmail && order.items.some((item) => !settled(item.receipt)),
  };
}

export const nothingLeft = (left: ReturnType<typeof pending>) => left.cards.length === 0 && !left.receipt;

// When to ask Resend to send a card: undefined for straight away. Later than a couple of
// minutes from now counts as scheduled. Resend can't book further ahead than
// MAX_SCHEDULE_DAYS, so a later day (only from orders placed before the basket's limit was
// tightened) is booked as late as it allows, an hour inside the limit.
export function bookAt(sendAt: string | undefined, now: number) {
  const at = sendAt ? Date.parse(sendAt) : NaN;
  if (!(at > now + 2 * MINUTE)) return undefined;
  return new Date(Math.min(at, now + MAX_SCHEDULE_DAYS * DAY - HOUR)).toISOString();
}

export function cardStatus(item: OrderItem, now = Date.now()): CardStatus {
  if (!wantsEmail(item)) return "self";
  if (item.cardEmail && !item.cardEmail.ok) return item.cardEmail.retry ? "retrying" : "failed";
  return item.sendAt && Date.parse(item.sendAt) > now ? "scheduled" : "emailed";
}

// Whether the buyer has the link in their hands to send: their own cards, and any we
// couldn't email.
export const sendsItself = (status: CardStatus) => status === "self" || status === "failed" || status === "retrying";

// The card email's subject, picked for the occasion ("Happy birthday, Olivia! 🎂").
export function cardSubject(t: Dict["email"], item: Pick<OrderItem, "to" | "from" | "occasion">) {
  // Languages not translated yet may not have the list.
  const subjects: Partial<Record<string, string>> | undefined = t.subjects;
  return fmt((item.occasion && subjects?.[item.occasion]) || t.cardSubject, { to: item.to, from: item.from });
}

// The From line for a card email: `"Sam via Envelette" <cards@envelette.com>`, on the same
// address as every other email. The name is cleaned so it can't break the header.
export function cardSender(emailFrom: string, name: string) {
  const address = (emailFrom.match(/<([^<>]+)>/)?.[1] ?? emailFrom).trim();
  const clean = name
    .replace(/[\p{Cc}"\\<>]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 70)
    .trim();
  return clean && address ? `"${clean}" <${address}>` : emailFrom;
}
