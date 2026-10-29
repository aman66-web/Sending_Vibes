import "server-only";
import { Resend } from "resend";
import { LANGUAGES, fmt, type Locale } from "@/i18n/config";
import { DICTS } from "@/i18n/dictionaries";
import type { Account } from "./auth";
import { emailReady } from "./email";
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

// The same look as the order emails (lib/email.ts).
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function layout(locale: Locale, body: string) {
  const { tag, dir } = LANGUAGES[locale];
  return `<!doctype html><html lang="${tag}" dir="${dir}"><body style="margin:0;background:#f3ecdf;font-family:Helvetica,Arial,sans-serif;color:#1f1b16">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3ecdf"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fbf7ef;border:2px solid #1f1b16;border-radius:18px">
<tr><td style="height:6px;border-radius:16px 16px 0 0;background:repeating-linear-gradient(-45deg,#d8432f 0 10px,#fbf7ef 10px 20px,#2b5aa6 20px 30px,#fbf7ef 30px 40px)"></td></tr>
<tr><td style="padding:28px 28px 8px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold">Envelette</td></tr>
<tr><td style="padding:8px 28px 28px;font-size:16px;line-height:1.55">${body}</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string, quiet = false) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 10px 0;background:${quiet ? "#fbf7ef" : "#d8432f"};color:${quiet ? "#1f1b16" : "#ffffff"};text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;border:2px solid #1f1b16">${esc(label)}</a>`;

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
  const note = fmt(t.replyNote, { to: item.to });
  const said = reply.message
    ? `<p style="margin:0 0 6px;color:#5b5247">${esc(t.replySaid)}</p>
<blockquote style="margin:0 0 22px;padding:14px 18px;background:#ffffff;border-left:4px solid #d8432f;border-radius:8px;font-family:Georgia,'Times New Roman',serif;font-size:18px;white-space:pre-line">${esc(reply.message)}</blockquote>`
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
