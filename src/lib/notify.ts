import "server-only";
import { Resend } from "resend";
import { fmt, type Locale } from "@/i18n/config";
import { DICTS } from "@/i18n/dictionaries";
import type { Account } from "./auth";
import { button, emailReady, esc, layout } from "./email";
import { getOrder, type Order, type OrderItem } from "./orders";
import { REACTION_EMOJI, type Reaction } from "./reply";
import { paidOrderFor } from "./storage";

// Emails to whoever bought a card, about what happened to it after they sent it: its first
// opening, and thank-yous from the person it's for. The buyer's address only ever comes
// from their order, on the server; nobody else sees it.

// The order a card was bought in, and that card's line in it.
export async function senderOf(cardId: string): Promise<{ order: Order; item: OrderItem } | null> {
  const orderId = await paidOrderFor(cardId);
  const order = orderId ? await getOrder(orderId) : null;
  const item = order?.items.find((i) => i.cardId === cardId);
  return order && item ? { order, item } : null;
}

// Signed in as the person who bought it: their own look at the card doesn't count as it being opened.
export function isBuyer(order: Order, account: Account) {
  const email = account.email?.toLowerCase();
  return order.userId === account.id || (!!email && order.buyerEmail?.toLowerCase() === email);
}

// The buyer's language, with English for anything not translated yet.
function words(locale: Locale) {
  const en = DICTS.en.reply.email;
  const theirs = DICTS[locale]?.reply?.email;
  return { ...en, ...theirs, replyTitle: { ...en.replyTitle, ...theirs?.replyTitle } };
}

// Built from the same pieces as the order emails (lib/email.ts).
const heading = (text: string) => `<h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2">${esc(text)}</h1>`;

// A key stops Resend sending the same email twice if a retry follows a failure.
async function send(order: Order, message: { subject: string; html: string; text: string }, key?: string) {
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send(
    { from: process.env.EMAIL_FROM!, to: order.buyerEmail!, ...message },
    key ? { idempotencyKey: `${order.id}-${key}` } : undefined,
  );
  if (error) throw new Error(`Email failed (${key ?? "reply"}): ${error.message}`);
}

// "Lily has opened your card 💌", the first time it's opened.
export async function sendOpenedEmail(order: Order, item: OrderItem) {
  if (!emailReady() || !order.buyerEmail) return;
  const t = words(order.locale);
  const title = fmt(t.openedTitle, { to: item.to });
  const body = fmt(t.openedBody, { to: item.to });
  const html = layout(
    order.locale,
    `${heading(title)}
<p style="margin:0 0 22px">${esc(body)}</p>
<p style="margin:0 0 16px">${button(`${order.site}/account`, t.seeCards)}${button(`${order.site}/create`, t.another, true)}</p>
<p style="margin:0;font-size:13px;color:#5b5247">${esc(t.openedNote)}</p>`,
  );
  const text = `${title}\n\n${body}\n\n${t.seeCards}: ${order.site}/account\n${t.another}: ${order.site}/create\n\n${t.openedNote}`;
  await send(order, { subject: fmt(t.openedSubject, { to: item.to }), html, text }, `opened-${item.cardId}`);
}

// A thank-you from the person the card is for: the reaction they tapped and any words they added.
export async function sendReplyEmail(order: Order, item: OrderItem, reply: { reaction: Reaction; message?: string }) {
  if (!emailReady() || !order.buyerEmail) throw new Error("Nowhere to send the reply");
  const t = words(order.locale);
  const emoji = REACTION_EMOJI[reply.reaction];
  const title = fmt(t.replyTitle[reply.reaction], { to: item.to });
  // A card we emailed for them came with the buyer's address to reply to, so only say this for links.
  const note = [fmt(t.replyNote, { to: item.to }), ...(item.delivery !== "email" ? [t.replyPrivate] : [])].join(" ");
  const said = reply.message
    ? `<p style="margin:0 0 6px;color:#5b5247">${esc(t.replySaid)}</p>
<blockquote style="margin:0 0 22px;padding:14px 18px;background:#ffffff;border-left:4px solid #c23a27;border-radius:8px;font-family:Georgia,'Times New Roman',serif;font-size:18px;white-space:pre-line">${esc(reply.message)}</blockquote>`
    : "";
  const html = layout(
    order.locale,
    `<p style="margin:0 0 6px;font-size:44px;line-height:1">${emoji}</p>
${heading(title)}
${said || '<div style="height:14px"></div>'}
<p style="margin:0 0 16px">${button(`${order.site}/create`, t.another)}</p>
<p style="margin:0;font-size:13px;color:#5b5247">${esc(note)}</p>`,
  );
  const text = [`${emoji} ${title}`, ...(reply.message ? ["", t.replySaid, reply.message] : []), "", `${t.another}: ${order.site}/create`, "", note].join("\n");
  await send(order, { subject: fmt(t.replySubject, { to: item.to, emoji }), html, text });
}
