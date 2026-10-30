"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Motif } from "@/components/card/motifs";
import { RichText } from "@/components/RichText";
import { LANGUAGES, fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { MAX_EMAILS, MAX_SCHEDULE_DAYS, MESSAGE_MAX, basketSnapshot, emailsOf, madeIds, onBasketChange, removeFromBasket, serverBasket, writeBasket, type BasketItem } from "@/lib/basket";
import { getTemplate } from "@/lib/catalog";
import { formatMoney, tierPrice } from "@/lib/pricing";
import { themes } from "@/lib/themes";
import { DEFAULT_TIME, ownZone, timeThereNow, zoneChoices, zoneName, zonedMoment } from "@/lib/when";

const noop = () => () => {};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// The furthest day to pick. One short of Resend's limit, since a time on the last day can be
// past it, and the email is only booked once payment comes through.
const SCHEDULE_DAYS = MAX_SCHEDULE_DAYS - 1;
const MINUTE = 60_000;

// The addresses to send to: typed, each once.
const cleanEmails = (item: BasketItem) => [...new Map(emailsOf(item).map((e) => [e.trim().toLowerCase(), e.trim()])).values()].filter(Boolean);

// YYYY-MM-DD for a day offset from today, in the visitor's own time zone.
function day(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// A tiny card front in the card's own colours.
function MiniFront({ item }: { item: BasketItem }) {
  const theme = themes[item.theme] ?? themes.rose;
  return (
    <div className="relative grid aspect-[4/5] w-20 shrink-0 place-items-center shadow-sm sm:w-24" style={{ background: theme.background, color: theme.accent }}>
      <div aria-hidden className="absolute inset-[7%] border" style={{ borderColor: theme.muted, opacity: 0.55 }} />
      <Motif occasion={item.occasion} className="h-9 w-9" />
    </div>
  );
}

export function Basket({ emailReady }: { emailReady: boolean }) {
  const { t, currency, locale } = useI18n();
  const b = t.basket;
  const tag = LANGUAGES[locale].tag;
  const items = useSyncExternalStore(onBasketChange, basketSnapshot, serverBasket);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  // The buyer's own time zone, and the places to choose from, named in their language.
  const own = useMemo(() => (hydrated ? ownZone() : "UTC"), [hydrated]);
  const zones = useMemo(() => (hydrated ? zoneChoices(tag, own) : []), [hydrated, tag, own]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  if (!hydrated) return <div className="mt-10 h-40" />;

  const update = (id: string, patch: Partial<BasketItem>) => {
    writeBasket(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
    setItemErrors((errors) => {
      const next = { ...errors };
      delete next[id];
      return next;
    });
  };

  if (!items.length) {
    return (
      <div className="sheet mt-10 p-10 text-center">
        <p className="font-brand text-2xl font-bold">{b.empty}</p>
        <Link href="/cards" className="btn btn-red mt-6 inline-flex px-6 py-3">
          {b.emptyCta}
        </Link>
        {error && <p className="mt-4 text-sm font-semibold text-hot">{error}</p>}
      </div>
    );
  }

  const total = formatMoney(items.reduce((sum, i) => sum + tierPrice(i.tier ?? "premade", currency), 0), currency);
  // Cards made in this browser can go back into the card maker to be changed.
  const made = madeIds();

  // The moment a card booked for later should arrive, in milliseconds.
  const due = (item: BasketItem) => zonedMoment(item.sendOn ?? "", item.sendTime || DEFAULT_TIME, item.timeZone || own);

  const pay = async () => {
    const problems: Record<string, string> = {};
    const now = Date.now();
    for (const item of items) {
      if (item.delivery !== "email") continue;
      const emails = cleanEmails(item);
      if (!emails.length) problems[item.id] = fmt(b.errors.needEmail, { name: item.to });
      else if (emails.some((e) => !EMAIL.test(e))) problems[item.id] = b.errors.badEmail;
      else if (item.sendOn !== undefined) {
        const at = due(item);
        if (!item.sendOn || Number.isNaN(at)) problems[item.id] = b.errors.needDate;
        else if (at < now + 2 * MINUTE) problems[item.id] = b.errors.past;
        else if (at > now + MAX_SCHEDULE_DAYS * 1440 * MINUTE - 60 * MINUTE) problems[item.id] = fmt(b.errors.tooFar, { days: SCHEDULE_DAYS });
      }
    }
    setItemErrors(problems);
    if (Object.keys(problems).length) return setError(null);
    if (!consent) return setError(b.errors.consent);
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            delivery: emailReady ? i.delivery : "self",
            ...(emailReady && i.delivery === "email"
              ? {
                  emails: cleanEmails(i),
                  ...(i.message?.trim() ? { message: i.message.trim() } : {}),
                  ...(i.sendOn ? { sendOn: i.sendOn, sendTime: i.sendTime || DEFAULT_TIME, timeZone: i.timeZone || own, sendAt: new Date(due(i)).toISOString() } : {}),
                }
              : {}),
          })),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) return window.location.assign(json.url);
      if (Array.isArray(json.gone)) removeFromBasket(json.gone);
      if (json.id) setItemErrors({ [json.id]: json.error ?? b.errors.failed });
      else setError(json.error ?? b.errors.failed);
    } catch {
      setError(b.errors.failed);
    }
    setBusy(false);
  };

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
      <ul className="space-y-5">
        {items.map((item) => {
          const template = getTemplate(item.template);
          const later = item.sendOn !== undefined;
          return (
            <li key={item.id} className="sheet p-5 sm:p-6">
              <div className="flex gap-4">
                <MiniFront item={item} />
                <div className="min-w-0 flex-1">
                  <p dir="auto" className="font-brand text-2xl font-bold leading-tight">
                    {fmt(b.cardFor, { to: item.to })}
                  </p>
                  <p dir="auto" className="text-ink/65">
                    {fmt(b.fromLine, { from: item.from })}
                    {template && <span className="text-ink/45"> · {template.name}</span>}
                  </p>
                  <p className="mt-1 font-semibold">{formatMoney(tierPrice(item.tier ?? "premade", currency), currency)}</p>
                  {made.has(item.id) && (
                    <Link
                      href={`/create?edit=${encodeURIComponent(item.id)}`}
                      className="mt-3 inline-flex min-h-11 items-center rounded-full border-2 border-ink/25 px-4 text-base font-semibold transition hover:border-ink"
                    >
                      {t.create.changeCard}
                    </Link>
                  )}
                </div>
                <button onClick={() => removeFromBasket([item.id])} className="self-start text-sm font-semibold text-ink/60 underline-offset-4 hover:text-ink hover:underline">
                  {b.remove}
                </button>
              </div>

              <fieldset className="mt-5 border-t-2 border-dashed border-ink/15 pt-4">
                <legend className="sr-only">{fmt(b.howSend, { name: item.to })}</legend>
                <p className="mb-3 font-semibold">{fmt(b.howSend, { name: item.to })}</p>
                <label className="flex cursor-pointer gap-3 rounded-xl p-2 hover:bg-cream/60">
                  <input type="radio" name={`delivery-${item.id}`} checked={item.delivery === "self" || !emailReady} onChange={() => update(item.id, { delivery: "self" })} className="mt-1 accent-[var(--color-hot)]" />
                  <span>
                    <span className="block font-semibold">{b.self}</span>
                    <span className="block text-sm text-ink/60">{b.selfHint}</span>
                  </span>
                </label>
                {emailReady ? (
                  <label className="flex cursor-pointer gap-3 rounded-xl p-2 hover:bg-cream/60">
                    <input type="radio" name={`delivery-${item.id}`} checked={item.delivery === "email"} onChange={() => update(item.id, { delivery: "email" })} className="mt-1 accent-[var(--color-hot)]" />
                    <span>
                      <span className="block font-semibold">{fmt(b.email, { name: item.to })}</span>
                      <span className="block text-sm text-ink/60">{b.emailHint}</span>
                    </span>
                  </label>
                ) : (
                  <p className="mt-2 px-2 text-sm text-ink/55">{b.emailSoon}</p>
                )}

                {emailReady && item.delivery === "email" && (
                  <EmailOptions item={item} update={(patch) => update(item.id, patch)} own={own} zones={zones} tag={tag} showErrors={Boolean(itemErrors[item.id])} />
                )}
                {itemErrors[item.id] && <p className="mt-3 text-sm font-semibold text-hot">{itemErrors[item.id]}</p>}
              </fieldset>
            </li>
          );
        })}
        <li>
          <Link href="/cards" className="inline-block font-semibold underline decoration-hot decoration-2 underline-offset-4">
            + {b.addAnother}
          </Link>
        </li>
      </ul>

      <aside className="sheet p-6 lg:sticky lg:top-24">
        <h2 className="font-brand text-2xl font-bold">{b.summary}</h2>
        <div className="mt-4 flex justify-between gap-4">
          <span>{fmt(b.line, { n: items.length })}</span>
          <span className="font-semibold">{total}</span>
        </div>
        <p className="mt-1 text-sm text-ink/60">{b.delivery}</p>
        <div className="mt-4 flex justify-between border-t-2 border-ink pt-4 font-brand text-xl font-bold">
          <span>{b.total}</span>
          <span>{total}</span>
        </div>
        <label className="mt-5 flex cursor-pointer gap-3 text-sm leading-snug text-ink/75">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--color-hot)]" />
          {/* Agreeing to the terms, then (smaller) that the cards come straight away, so they
              can't be cancelled once delivered, which the law asks them to say they understand. */}
          <span>
            {b.consent.split("\n").map((line, i) =>
              i === 0 ? (
                <span key={i} className="block text-base font-semibold text-ink">
                  <RichText text={line} />
                </span>
              ) : (
                <span key={i} className="mt-1 block">
                  {line}
                </span>
              ),
            )}
          </span>
        </label>
        <button onClick={pay} disabled={busy} className="btn btn-red mt-5 w-full py-3.5 text-lg disabled:opacity-60">
          {busy ? b.paying : fmt(b.pay, { amount: total })}
        </button>
        {error && <p className="mt-3 text-sm font-semibold text-hot">{error}</p>}
        <p className="mt-4 flex items-center gap-2 text-xs text-ink/55">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          {b.secure}
        </p>
      </aside>
    </div>
  );
}

type Zone = { zone: string; name: string };

// Emailing a card for them: who to (up to MAX_EMAILS addresses), the buyer's own words for the
// email, and when: straight away, or on a day and time they pick, in the time zone it should
// arrive in (theirs to start with).
function EmailOptions({ item, update, own, zones, tag, showErrors }: { item: BasketItem; update: (patch: Partial<BasketItem>) => void; own: string; zones: Zone[]; tag: string; showErrors: boolean }) {
  const b = useI18n().t.basket;
  const emails = emailsOf(item);
  const later = item.sendOn !== undefined;
  const zone = item.timeZone || own;
  // A zone picked on another device, say, that isn't in the list.
  const choices = zones.some((z) => z.zone === zone) ? zones : [{ zone, name: zoneName(zone, tag) }, ...zones];
  const setEmails = (list: string[]) => update({ emails: list, email: undefined });
  const field = "mt-1 w-full rounded-xl border-2 border-ink/20 bg-paper px-3 py-3 text-lg outline-none focus:border-ink";
  const message = item.message ?? "";

  return (
    <div className="mt-3 space-y-5 rounded-2xl bg-cream/70 p-4 sm:ms-8">
      <div>
        <ul className="space-y-3">
          {emails.map((email, i) => {
            const bad = showErrors && email.trim() !== "" && !EMAIL.test(email.trim());
            return (
              <li key={i}>
                <label className="block">
                  <span className="text-sm font-semibold">{i === 0 ? fmt(b.emailLabel, { name: item.to }) : b.anotherEmail}</span>
                  <span className="flex items-center gap-2">
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="off"
                      dir="ltr"
                      value={email}
                      aria-invalid={bad || undefined}
                      onChange={(e) => setEmails(emails.map((x, j) => (j === i ? e.target.value : x)))}
                      className={`${field} ${bad ? "border-hot" : ""}`}
                    />
                    {emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEmails(emails.filter((_, j) => j !== i))}
                        aria-label={b.removeEmail}
                        title={b.removeEmail}
                        className="mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-ink/20 text-xl font-bold text-ink/70 transition hover:border-ink hover:text-ink"
                      >
                        ×
                      </button>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {emails.length < MAX_EMAILS && (
          <button
            type="button"
            onClick={() => setEmails([...emails, ""])}
            className="mt-3 inline-flex min-h-11 items-center rounded-full border-2 border-ink/25 px-4 text-base font-semibold transition hover:border-ink"
          >
            + {b.addEmail}
          </button>
        )}
        <p className="mt-2 text-sm text-ink/60">{fmt(b.emailsHint, { n: MAX_EMAILS })}</p>
        {/* The email's reply address is the buyer's, so say so. */}
        <p className="mt-1 text-sm text-ink/60">{fmt(b.replyHint, { name: item.to })}</p>
      </div>

      <label className="block">
        <span className="text-sm font-semibold">{b.messageLabel}</span>
        <textarea
          dir="auto"
          rows={3}
          maxLength={MESSAGE_MAX}
          value={message}
          placeholder={b.messagePlaceholder}
          onChange={(e) => update({ message: e.target.value })}
          className={`${field} min-h-24 resize-y leading-snug`}
        />
        <span className="mt-1 flex flex-wrap justify-between gap-x-4 text-sm text-ink/60">
          <span>{fmt(b.messageHint, { name: item.to })}</span>
          {message.length > MESSAGE_MAX - 100 && <span aria-live="polite">{fmt(b.messageLeft, { n: MESSAGE_MAX - message.length })}</span>}
        </span>
      </label>

      <div>
        <p className="text-sm font-semibold">{b.when}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { on: !later, label: b.now, patch: { sendOn: undefined } },
            {
              on: later,
              label: b.later,
              patch: {
                sendOn: item.sendOn ?? day(1),
                sendTime: item.sendTime ?? DEFAULT_TIME,
                timeZone: item.timeZone ?? own,
              },
            },
          ].map((choice) => (
            <button
              key={choice.label}
              type="button"
              aria-pressed={choice.on}
              onClick={() => update(choice.patch)}
              className={`min-h-11 rounded-full border-2 px-4 py-1.5 text-base font-semibold transition ${choice.on ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink/50"}`}
            >
              {choice.label}
            </button>
          ))}
        </div>
        {later && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold">{b.day}</span>
              <input type="date" min={day(0)} max={day(SCHEDULE_DAYS)} value={item.sendOn} onChange={(e) => update({ sendOn: e.target.value })} className={field} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">{b.time}</span>
              <input type="time" step={60} value={item.sendTime ?? DEFAULT_TIME} onChange={(e) => update({ sendTime: e.target.value })} className={field} />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold">{b.zone}</span>
              <select value={zone} onChange={(e) => update({ timeZone: e.target.value })} className={field}>
                {choices.map((z) => (
                  <option key={z.zone} value={z.zone}>
                    {z.zone === own ? `${b.ownZone} (${z.name})` : z.name}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-sm text-ink/60">
                {b.zoneHint} {fmt(b.zoneNow, { time: timeThereNow(zone, tag) })}
              </span>
            </label>
            <p className="text-sm text-ink/55 sm:col-span-2">{fmt(b.dateHint, { days: SCHEDULE_DAYS })}</p>
          </div>
        )}
      </div>
    </div>
  );
}
