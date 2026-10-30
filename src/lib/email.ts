import "server-only";
import { Resend } from "resend";
import { LANGUAGES, fmt, type Locale } from "@/i18n/config";
import { DICTS } from "@/i18n/dictionaries";
import {
  bookAt,
  cardSender,
  cardStatus,
  cardSubject,
  emailList,
  isFinal,
  notReached,
  pending,
  recipients,
  resultFor,
  sendWhen,
  sendsItself,
  unsent,
  withResults,
  type CardStatus,
  type EmailResult,
} from "./delivery";
import type { Order, OrderItem } from "./orders";
import { formatMoney } from "./pricing";

// Email goes out through Resend once RESEND_API_KEY and EMAIL_FROM
// (e.g. "Envelette <cards@envelette.com>") are set.
export function emailReady() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

// The pieces every email is built from, shared with lib/notify.ts so they all look alike.
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const cardUrl = (order: Order, item: OrderItem) => `${order.site}/c/${item.cardId}`;

// The buyer's own look at a card we're emailing for them, so it isn't counted as them opening it.
const ownUrl = (order: Order, item: OrderItem) => `${cardUrl(order, item)}?me=1`;

// When the buyer picked for it to arrive, written out in their language.
const sendDay = (order: Order, item: OrderItem) => sendWhen(DICTS[order.locale].basket, LANGUAGES[order.locale].tag, item);

// Everyone it's going to, or just the ones it couldn't reach, as a list in their language.
const addresses = (order: Order, list: string[]) => emailList(list, LANGUAGES[order.locale].tag);

// `preheader` is the line inboxes show after the subject; it's hidden in the email itself.
export function layout(locale: Locale, body: string, preheader = "") {
  const dir = LANGUAGES[locale].dir;
  return `<!doctype html><html lang="${LANGUAGES[locale].tag}" dir="${dir}"><body style="margin:0;background:#f3ecdf;font-family:Helvetica,Arial,sans-serif;color:#1f1b16">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${esc(preheader)}${"&#847;&zwnj;&nbsp;".repeat(30)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3ecdf"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fbf7ef;border:2px solid #1f1b16;border-radius:18px">
<tr><td style="height:6px;border-radius:16px 16px 0 0;background:repeating-linear-gradient(-45deg,#c23a27 0 10px,#fbf7ef 10px 20px,#2b5aa6 20px 30px,#fbf7ef 30px 40px)"></td></tr>
<tr><td style="padding:28px 28px 8px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold">Envelette</td></tr>
<tr><td style="padding:8px 28px 28px;font-size:16px;line-height:1.55">${body}</td></tr>
</table></td></tr></table></body></html>`;
}

// The site's postbox red (globals.css), or paper for a quieter second button.
export const button = (href: string, label: string, quiet = false) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:0 4px 10px;background:${quiet ? "#fbf7ef" : "#c23a27"};color:${quiet ? "#1f1b16" : "#ffffff"};text-decoration:none;font-size:18px;font-weight:bold;padding:16px 30px;border-radius:999px;border:2px solid #1f1b16">${esc(label)}</a>`;

const smallButton = (href: string, label: string, background: string, color: string) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:0 6px 6px 0;background:${background};color:${color};text-decoration:none;font-size:15px;font-weight:bold;padding:10px 18px;border-radius:999px;border:2px solid #1f1b16">${esc(label)}</a>`;

// One-tap WhatsApp and email buttons for a link the buyer sends themselves, with the
// same words as the thank-you page.
function shareButtons(order: Order, item: OrderItem) {
  const { create, basket } = DICTS[order.locale];
  const url = cardUrl(order, item);
  const message = fmt(basket.share.message, { to: item.to });
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`;
  const mail = `mailto:?subject=${encodeURIComponent(fmt(basket.share.title, { from: item.from }))}&body=${encodeURIComponent(`${message}\n\n${url}`)}`;
  return `<div style="margin-top:4px">${smallButton(whatsapp, create.whatsapp, "#25D366", "#1f1b16")}${smallButton(mail, basket.share.byEmail, "#fbf7ef", "#1f1b16")}</div>`;
}

// The buyer's own look at a link they're sending on (?me=1), so checking it isn't counted as
// it being opened. The plain link stays plain: it's the one they copy and pass on.
const watchLink = (order: Order, item: OrderItem) =>
  `<div style="margin-bottom:10px"><a href="${esc(ownUrl(order, item))}" style="color:#2b5aa6;font-weight:bold">&#9654; ${esc(DICTS[order.locale].basket.share.watch)}</a></div>`;

// What the receipt says about each card, once this attempt's card emails have gone (or not).
function receiptNote(order: Order, item: OrderItem, status: CardStatus) {
  const t = DICTS[order.locale].email;
  const email = addresses(order, recipients(item));
  const missed = addresses(order, notReached(item));
  switch (status) {
    case "scheduled":
      return fmt(t.willEmail, { email, date: sendDay(order, item) });
    case "emailed":
      return fmt(t.emailedNow, { email });
    case "failed":
      return fmt(t.emailFailed, { email: missed, to: item.to });
    case "retrying":
      return fmt(t.emailRetrying, { email: missed, to: item.to });
    default:
      return fmt(t.sendYourself, { to: item.to });
  }
}

function receipt(order: Order) {
  const t = DICTS[order.locale].email;
  const rows = order.items
    .map((item) => {
      const status = cardStatus(item);
      // The plain link, as it's the one people copy and pass on (even for a card we email, if it
      // ends up in spam), and a "Watch it" link for the buyer's own look.
      const link = cardUrl(order, item);
      return `<tr><td style="padding:14px 0;border-top:1px solid #e3d9c6">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:bold">${esc(fmt(t.cardFor, { to: item.to, from: item.from }))}</div>
<div style="margin:4px 0 10px;color:#5b5247">${esc(receiptNote(order, item, status))}</div>
<div style="margin-bottom:8px;word-break:break-all"><a href="${esc(link)}" style="color:#2b5aa6">${esc(link)}</a></div>
${watchLink(order, item)}${sendsItself(status) ? shareButtons(order, item) : ""}
</td></tr>`;
    })
    .join("");
  const total = order.amountTotal !== undefined ? `<p style="margin:16px 0 0;font-weight:bold">${esc(fmt(t.total, { amount: formatMoney(order.amountTotal, order.currency) }))}</p>` : "";
  const html = layout(
    order.locale,
    `<h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2">${esc(t.receiptTitle)}</h1>
<p style="margin:0 0 16px">${esc(t.receiptIntro)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>${total}
<p style="margin:24px 0 0;font-size:13px;color:#5b5247">${esc(fmt(t.help, { url: `${order.site}/help` }))}</p>`,
  );
  const text = [
    t.receiptTitle,
    "",
    t.receiptIntro,
    "",
    ...order.items.map((item) => {
      const status = cardStatus(item);
      const watch = `▶ ${DICTS[order.locale].basket.share.watch}: ${ownUrl(order, item)}`;
      return `${fmt(t.cardFor, { to: item.to, from: item.from })}\n${receiptNote(order, item, status)}\n${cardUrl(order, item)}\n${watch}\n`;
    }),
  ].join("\n");
  return { subject: t.receiptSubject, html, text };
}

// The card itself, arriving: their envelope (the same picture as the link preview), a big
// button, and the plain link under it for email apps that hide buttons or pictures.
// `replies` says whether answering it reaches the buyer.
function cardEmail(order: Order, item: OrderItem, replies: boolean) {
  const t = DICTS[order.locale].email;
  const url = cardUrl(order, item);
  // The buyer's own words, as they typed them (line breaks kept), signed with their name.
  const note = item.message
    ? `<div dir="auto" style="margin:0 0 20px;padding:16px 18px;background:#ffffff;border:2px solid #1f1b16;border-radius:14px;font-size:18px;line-height:1.5;white-space:pre-line">${esc(item.message)}<div style="margin-top:8px;font-family:Georgia,'Times New Roman',serif;font-weight:bold">${esc(fmt(t.messageSign, { from: item.from }))}</div></div>`
    : "";
  const html = layout(
    order.locale,
    `<h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2">${esc(fmt(t.cardTitle, { from: item.from }))}</h1>
${note}<p style="margin:0 0 20px">${esc(fmt(t.cardBody, { to: item.to }))}</p>
<p style="margin:0 0 22px"><a href="${esc(url)}"><img src="${esc(`${url}/opengraph-image`)}" width="464" alt="${esc(fmt(t.envelopeAlt, { to: item.to, from: item.from }))}" style="display:block;width:100%;max-width:464px;height:auto;border:2px solid #1f1b16;border-radius:12px"></a></p>
<p style="margin:0 0 22px;text-align:center">${button(url, t.cardButton)}</p>
<p style="margin:0 0 4px;font-size:15px;color:#5b5247">${esc(t.linkHint)}</p>
<p style="margin:0 0 24px;font-size:15px;word-break:break-all"><a href="${esc(url)}" style="color:#2b5aa6">${esc(url)}</a></p>
${replies ? `<p style="margin:0 0 6px;font-size:13px;color:#5b5247">${esc(fmt(t.replyNote, { from: item.from }))}</p>` : ""}
<p style="margin:0;font-size:13px;color:#5b5247">${esc(fmt(t.cardFooter, { from: item.from }))}</p>`,
    fmt(t.preheader, { to: item.to, from: item.from }),
  );
  const words = item.message ? `${item.message}\n${fmt(t.messageSign, { from: item.from })}\n\n` : "";
  const text = `${fmt(t.cardTitle, { from: item.from })}\n\n${words}${fmt(t.cardBody, { to: item.to })}\n\n${url}`;
  return { subject: cardSubject(t, item), html, text };
}

type Message = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  scheduledAt?: string;
};

// Sends what the order still needs (see delivery.ts): each card we're emailing, then the
// buyer's receipt with every link. Each email is tried on its own, so one bad address
// can't hold up the others or the receipt, and nothing here throws: the results say what
// went. Idempotency keys stop Resend sending twice if a retry follows a partial failure.
export async function sendOrderEmails(order: Order, todo = pending(order)) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM!;
  const send = async (key: string, message: Message): Promise<EmailResult> => {
    for (let tries = 0; ; tries++) {
      let error: {
        name?: string;
        statusCode?: number | null;
        message: string;
      } | null;
      let id: string | undefined;
      try {
        let data: { id?: string } | null;
        ({ data, error } = await resend.emails.send(message, {
          idempotencyKey: `${order.id}-${key}`,
        }));
        id = data?.id;
      } catch (e) {
        error = { message: e instanceof Error ? e.message : String(e) };
      }
      const at = new Date().toISOString();
      if (!error) return { at, ok: true, ...(id ? { id } : {}) };
      // Resend takes a few emails a second, which a big basket can go over.
      if (error.name === "rate_limit_exceeded" && tries < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1100));
        continue;
      }
      return { at, ok: false, error: `${error.name ?? "error"}: ${error.message}`.slice(0, 300), retry: !isFinal(error) };
    }
  };

  // Each address gets its own email, so nobody sees the others' addresses and one that bounces
  // can't stop the rest. Results are kept by address.
  const cards: Record<string, Record<string, EmailResult>> = {};
  for (const item of todo.cards) {
    const scheduledAt = bookAt(item.sendAt, Date.now());
    // From "Sam via Envelette", and replies go to Sam.
    const sender = cardSender(from, fmt(DICTS[order.locale].email.fromName, { from: item.from }));
    const all = recipients(item);
    const results: Record<string, EmailResult> = {};
    for (const address of unsent(item)) {
      const message = (replies: boolean) => ({
        to: address,
        ...cardEmail(order, item, replies),
        ...(scheduledAt ? { scheduledAt } : {}),
      });
      // Older orders' one email kept its old key, so a retry can't send it twice.
      const key = item.emails ? `card-${item.cardId}-${all.indexOf(address)}` : `card-${item.cardId}`;
      let result = await send(key, {
        ...message(!!order.buyerEmail),
        from: sender,
        ...(order.buyerEmail ? { replyTo: order.buyerEmail } : {}),
      });
      // Those are niceties: if Resend won't take them, send it plainly rather than not at all.
      if (!result.ok && !result.retry) result = await send(`${key}-plain`, { ...message(false), from });
      results[address] = result;
    }
    cards[item.cardId] = results;
  }

  // The receipt reflects how the card emails just went, so the buyer knows which to send themselves.
  const sent: Order = {
    ...order,
    items: order.items.map((i) => withResults(i, cards[i.cardId])),
  };
  const receiptResult = todo.receipt && order.buyerEmail ? await send("receipt", { from, to: order.buyerEmail, ...receipt(sent) }) : undefined;
  return { cards, receipt: receiptResult };
}

// The code someone types to sign in with their email address.
export async function sendSignInCode(to: string, code: string, locale: Locale) {
  const t = DICTS[locale].email;
  const html = layout(
    locale,
    `<h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2">${esc(t.codeTitle)}</h1>
<p style="margin:0 0 18px">${esc(t.codeIntro)}</p>
<p style="margin:0 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:bold;letter-spacing:8px">${esc(code)}</p>
<p style="margin:0;font-size:13px;color:#5b5247">${esc(t.codeFooter)}</p>`,
  );
  const text = `${t.codeIntro}\n\n${code}\n\n${t.codeFooter}`;
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: process.env.EMAIL_FROM!, to, subject: fmt(t.codeSubject, { code }), html, text });
  if (error) throw new Error(`Sign-in code email failed: ${error.message}`);
}

// Resend's booked emails, newest first, for finding one booked before ids were kept.
async function bookedEmails(resend: Resend) {
  const found: {
    id: string;
    to: string[];
    scheduled_at: string | null;
    last_event: string;
  }[] = [];
  let after: string | undefined;
  for (let page = 0; page < 3; page++) {
    const { data, error } = await resend.emails.list({
      limit: 100,
      ...(after ? { after } : {}),
    });
    if (error || !data) break;
    found.push(...data.data.filter((e) => e.last_event === "scheduled"));
    if (!data.has_more || !data.data.length) break;
    after = data.data[data.data.length - 1].id;
  }
  return found;
}

// Resend writes times like "2026-10-31 09:00:00+00".
const parseTime = (at: string | null) => (at ? Date.parse(at.replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00")) : NaN);

// "Send it now" for a booked card: each address's email moves to a minute from now (Resend
// needs a time ahead), found by the id Resend gave it or, for an order from before ids were
// kept, among Resend's booked emails. Returns the results that moved, with `movedAt` set, and
// whether every address's did. Ones that didn't keep their booking, so pressing again is safe.
export async function moveToNow(item: OrderItem): Promise<{ results: Record<string, EmailResult>; all: boolean }> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const soon = new Date(Date.now() + 60_000).toISOString();
  const due = item.sendAt ? Date.parse(item.sendAt) : NaN;
  let booked: Awaited<ReturnType<typeof bookedEmails>> | undefined;
  const results: Record<string, EmailResult> = {};
  let all = true;
  for (const address of recipients(item)) {
    const result = resultFor(item, address);
    if (result?.movedAt) continue;
    if (!result?.ok) {
      all = false;
      continue;
    }
    let id = result.id;
    if (!id) {
      booked ??= await bookedEmails(resend).catch(() => []);
      const lower = address.toLowerCase();
      // Booked for the same day (a day either side, whatever the time zone).
      id = booked.find((e) => e.to.some((to) => to.toLowerCase() === lower) && Math.abs(parseTime(e.scheduled_at) - due) < 86_400_000)?.id;
    }
    const { error } = id ? await resend.emails.update({ id, scheduledAt: soon }).catch((e) => ({ error: { message: String(e) } })) : { error: { message: "No booked email found" } };
    if (error) {
      console.error(`Couldn't move a booked card email to now: ${error.message}`);
      all = false;
      continue;
    }
    results[address] = { ...result, id, movedAt: new Date().toISOString() };
  }
  return { results, all };
}
