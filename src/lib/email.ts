import "server-only";
import { Resend } from "resend";
import { LANGUAGES, fmt } from "@/i18n/config";
import { DICTS } from "@/i18n/dictionaries";
import type { Order, OrderItem } from "./orders";
import { formatMoney } from "./pricing";

// Email goes out through Resend once RESEND_API_KEY and EMAIL_FROM
// (e.g. "Sending Vibes <cards@yourdomain.com>") are set.
export function emailReady() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const cardUrl = (order: Order, item: OrderItem) => `${order.site}/c/${item.cardId}`;

// The day the buyer picked, written out in their language.
function sendDay(order: Order, item: OrderItem) {
  const day = item.sendOn ? new Date(`${item.sendOn}T12:00:00Z`) : new Date(item.sendAt!);
  return new Intl.DateTimeFormat(LANGUAGES[order.locale].tag, { dateStyle: "long", timeZone: "UTC" }).format(day);
}

// Later than a couple of minutes from now counts as scheduled.
const scheduled = (item: OrderItem) => Boolean(item.sendAt && Date.parse(item.sendAt) > Date.now() + 2 * 60_000);

function layout(order: Order, body: string) {
  const dir = LANGUAGES[order.locale].dir;
  return `<!doctype html><html lang="${LANGUAGES[order.locale].tag}" dir="${dir}"><body style="margin:0;background:#f3ecdf;font-family:Helvetica,Arial,sans-serif;color:#1f1b16">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3ecdf"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fbf7ef;border:2px solid #1f1b16;border-radius:18px">
<tr><td style="height:6px;border-radius:16px 16px 0 0;background:repeating-linear-gradient(-45deg,#d8432f 0 10px,#fbf7ef 10px 20px,#2b5aa6 20px 30px,#fbf7ef 30px 40px)"></td></tr>
<tr><td style="padding:28px 28px 8px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:bold">Sending Vibes</td></tr>
<tr><td style="padding:8px 28px 28px;font-size:16px;line-height:1.55">${body}</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:#d8432f;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;border:2px solid #1f1b16">${esc(label)}</a>`;

function receipt(order: Order) {
  const t = DICTS[order.locale].email;
  const rows = order.items
    .map((item) => {
      const note =
        item.delivery === "email"
          ? scheduled(item)
            ? fmt(t.willEmail, { email: item.email!, date: sendDay(order, item) })
            : fmt(t.emailedNow, { email: item.email! })
          : fmt(t.sendYourself, { to: item.to });
      return `<tr><td style="padding:14px 0;border-top:1px solid #e3d9c6">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:bold">${esc(fmt(t.cardFor, { to: item.to, from: item.from }))}</div>
<div style="margin:4px 0 10px;color:#5b5247">${esc(note)}</div>
<div style="margin-bottom:8px;word-break:break-all"><a href="${esc(cardUrl(order, item))}" style="color:#2b5aa6">${esc(cardUrl(order, item))}</a></div>
</td></tr>`;
    })
    .join("");
  const total = order.amountTotal !== undefined ? `<p style="margin:16px 0 0;font-weight:bold">${esc(fmt(t.total, { amount: formatMoney(order.amountTotal, order.currency) }))}</p>` : "";
  const html = layout(
    order,
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
    ...order.items.map((item) => `${fmt(t.cardFor, { to: item.to, from: item.from })}\n${cardUrl(order, item)}`),
  ].join("\n");
  return { subject: t.receiptSubject, html, text };
}

function cardEmail(order: Order, item: OrderItem) {
  const t = DICTS[order.locale].email;
  const html = layout(
    order,
    `<h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2">${esc(fmt(t.cardTitle, { from: item.from }))}</h1>
<p style="margin:0 0 22px">${esc(fmt(t.cardBody, { to: item.to }))}</p>
<p style="margin:0 0 26px">${button(cardUrl(order, item), t.cardButton)}</p>
<p style="margin:0;font-size:13px;color:#5b5247">${esc(fmt(t.cardFooter, { from: item.from }))}</p>`,
  );
  const text = `${fmt(t.cardTitle, { from: item.from })}\n\n${fmt(t.cardBody, { to: item.to })}\n\n${cardUrl(order, item)}`;
  return { subject: fmt(t.cardSubject, { to: item.to, from: item.from }), html, text };
}

// The buyer's receipt with every link, and each card the buyer asked us to email.
// Idempotency keys stop Resend sending twice if a retry follows a partial failure.
export async function sendOrderEmails(order: Order) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM!;
  const send = async (key: string, to: string, message: { subject: string; html: string; text: string }, scheduledAt?: string) => {
    const { error } = await resend.emails.send({ from, to, ...message, ...(scheduledAt ? { scheduledAt } : {}) }, { idempotencyKey: `${order.id}-${key}` });
    if (error) throw new Error(`Email failed (${key}): ${error.message}`);
  };
  for (const item of order.items) {
    if (item.delivery === "email" && item.email) await send(`card-${item.cardId}`, item.email, cardEmail(order, item), scheduled(item) ? item.sendAt : undefined);
  }
  if (order.buyerEmail) await send("receipt", order.buyerEmail, receipt(order));
}
