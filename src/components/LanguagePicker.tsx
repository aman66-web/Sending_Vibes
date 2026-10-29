"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { LANGUAGES, LIVE_LOCALES, LOCALES, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { COMMON_CURRENCIES, CURRENCIES, CURRENCY_COOKIE, currencySymbol, type Currency } from "@/lib/pricing";

// Saves the choice and reloads the same page; the server then sends it in that language or currency.
function save(cookie: string, value: string) {
  document.cookie = `${cookie}=${value}; path=/; max-age=31536000; samesite=lax`;
  // Drop a language from the address (e.g. /hi/cards) so the cookie decides.
  const first = window.location.pathname.split("/")[1];
  const path = (LOCALES as readonly string[]).includes(first) ? window.location.pathname.slice(first.length + 1) || "/" : window.location.pathname;
  window.location.assign(path + window.location.search);
}

// With only one language switched on, there's just the currency to choose.
const PICK_LANGUAGE = LIVE_LOCALES.length > 1;

// The globe button in the top corner: language, and currency.
export function LanguagePicker() {
  const { locale, currency, t } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const choose = (next: Locale) => {
    setOpen(false);
    if (next !== locale) save(LOCALE_COOKIE, next);
  };
  const chooseCurrency = (next: Currency) => {
    setOpen(false);
    if (next !== currency) save(CURRENCY_COOKIE, next);
  };
  // Each currency's name in their language ("Australian dollar"), only once the menu is open,
  // so the page as sent and as first drawn always match.
  const names = open ? new Intl.DisplayNames([LANGUAGES[locale].tag, "en"], { type: "currency" }) : null;
  const nameOf = (c: Currency) => names?.of(c.toUpperCase()) ?? c.toUpperCase();
  // After the most common, the rest in alphabetical order by name.
  const others = CURRENCIES.filter((c) => !COMMON_CURRENCIES.includes(c)).sort((a, b) => nameOf(a).localeCompare(nameOf(b), LANGUAGES[locale].tag));

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={PICK_LANGUAGE ? `${t.nav.language}: ${LANGUAGES[locale].name}` : `${t.common.currency}: ${currency.toUpperCase()}`}
        className="flex h-10 items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-2.5 text-sm font-bold transition hover:bg-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
        </svg>
        <span className={PICK_LANGUAGE ? "uppercase" : ""}>{PICK_LANGUAGE ? locale : currencySymbol(currency)}</span>
      </button>
      {open && (
        // On a phone it spans the screen under the header, so it never hangs off an edge.
        <div className="sheet fixed inset-x-4 top-16 z-50 overflow-hidden p-1.5 sm:absolute sm:inset-x-auto sm:end-0 sm:top-12 sm:w-64">
          {PICK_LANGUAGE && (
            <ul role="listbox" aria-label={t.nav.language}>
              {LIVE_LOCALES.map((l) => (
                <li key={l}>
                  <button
                    role="option"
                    aria-selected={l === locale}
                    lang={LANGUAGES[l].tag}
                    onClick={() => choose(l)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-start transition hover:bg-cream ${l === locale ? "bg-cream font-bold" : "font-semibold"}`}
                  >
                    <span>{LANGUAGES[l].name}</span>
                    <span className="text-xs font-semibold text-ink/50" lang="en">
                      {l === locale ? "✓" : LANGUAGES[l].english}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className={PICK_LANGUAGE ? "mt-1.5 border-t-2 border-dashed border-ink/15 px-2 pb-1 pt-2.5" : "px-2 pb-1 pt-1.5"}>
            <p className="text-xs font-bold text-ink/55">{t.common.currency}</p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-ink/45">{t.common.commonCurrencies}</p>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5" dir="ltr">
              {COMMON_CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => chooseCurrency(c)}
                  aria-pressed={c === currency}
                  aria-label={`${nameOf(c)} (${c.toUpperCase()})`}
                  className={`rounded-full border-2 py-1.5 text-sm font-bold transition ${c === currency ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink"}`}
                >
                  {currencySymbol(c)} {c.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-ink/45">{t.common.allCurrencies}</p>
            {/* Scrolls on its own, so the menu stays on the screen. */}
            <ul className="-mx-1 mt-1 max-h-60 overflow-y-auto overscroll-contain" aria-label={t.common.allCurrencies}>
              {others.map((c) => (
                <li key={c}>
                  <button
                    onClick={() => chooseCurrency(c)}
                    aria-pressed={c === currency}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-start text-sm transition hover:bg-cream ${c === currency ? "bg-cream font-bold" : "font-semibold"}`}
                  >
                    <span className="w-11 shrink-0 text-center font-bold" dir="ltr">
                      {currencySymbol(c)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{nameOf(c)}</span>
                    <span className="shrink-0 text-xs text-ink/50" dir="ltr">
                      {c === currency ? "✓" : c.toUpperCase()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
