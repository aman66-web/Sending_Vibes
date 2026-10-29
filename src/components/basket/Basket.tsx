"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Motif } from "@/components/card/motifs";
import { RichText } from "@/components/RichText";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { MAX_SCHEDULE_DAYS, basketSnapshot, onBasketChange, removeFromBasket, serverBasket, writeBasket, type BasketItem } from "@/lib/basket";
import { getTemplate } from "@/lib/catalog";
import { formatMoney, tierPrice } from "@/lib/pricing";
import { themes } from "@/lib/themes";

const noop = () => () => {};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// The furthest day to pick. One short of Resend's limit, since 9am on the last day can be
// past it, and the email is only booked once payment comes through.
const SCHEDULE_DAYS = MAX_SCHEDULE_DAYS - 1;

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
  const { t, currency } = useI18n();
  const b = t.basket;
  const items = useSyncExternalStore(onBasketChange, basketSnapshot, serverBasket);
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
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

  const pay = async () => {
    const problems: Record<string, string> = {};
    for (const item of items) {
      if (item.delivery !== "email") continue;
      if (!item.email || !EMAIL.test(item.email.trim())) problems[item.id] = item.email ? b.errors.badEmail : fmt(b.errors.needEmail, { name: item.to });
      else if (item.sendOn !== undefined && !item.sendOn) problems[item.id] = b.errors.needDate;
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
              ? { email: i.email!.trim(), ...(i.sendOn ? { sendOn: i.sendOn, sendAt: new Date(`${i.sendOn}T09:00`).toISOString() } : {}) }
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
                  <div className="mt-3 space-y-4 rounded-2xl bg-cream/70 p-4 sm:ms-8">
                    <label className="block">
                      <span className="text-sm font-semibold">{fmt(b.emailLabel, { name: item.to })}</span>
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="off"
                        dir="ltr"
                        value={item.email ?? ""}
                        onChange={(e) => update(item.id, { email: e.target.value })}
                        className="mt-1 w-full rounded-xl border-2 border-ink/20 bg-paper px-3 py-2.5 outline-none focus:border-ink"
                      />
                      {/* The email's reply address is the buyer's, so say so. */}
                      <span className="mt-1 block text-sm text-ink/60">{fmt(b.replyHint, { name: item.to })}</span>
                    </label>
                    <div>
                      <p className="text-sm font-semibold">{b.when}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[
                          { on: !later, label: b.now, patch: { sendOn: undefined } },
                          { on: later, label: b.later, patch: { sendOn: item.sendOn ?? day(1) } },
                        ].map((choice) => (
                          <button
                            key={choice.label}
                            type="button"
                            aria-pressed={choice.on}
                            onClick={() => update(item.id, choice.patch)}
                            className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition ${choice.on ? "border-ink bg-ink text-paper" : "border-ink/20 hover:border-ink/50"}`}
                          >
                            {choice.label}
                          </button>
                        ))}
                      </div>
                      {later && (
                        <div className="mt-3">
                          <input
                            type="date"
                            aria-label={b.when}
                            min={day(0)}
                            max={day(SCHEDULE_DAYS)}
                            value={item.sendOn}
                            onChange={(e) => update(item.id, { sendOn: e.target.value })}
                            className="rounded-xl border-2 border-ink/20 bg-paper px-3 py-2 outline-none focus:border-ink"
                          />
                          <p className="mt-1 text-xs text-ink/55">{fmt(b.dateHint, { days: SCHEDULE_DAYS })}</p>
                        </div>
                      )}
                    </div>
                  </div>
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
