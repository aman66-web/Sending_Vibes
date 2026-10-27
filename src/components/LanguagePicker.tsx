"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { LANGUAGES, LOCALES, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { CURRENCIES, CURRENCY_COOKIE, type Currency } from "@/lib/pricing";

// Saves the choice and reloads the same page; the server then sends it in that language or currency.
function save(cookie: string, value: string) {
  document.cookie = `${cookie}=${value}; path=/; max-age=31536000; samesite=lax`;
  // Drop a language from the address (e.g. /hi/cards) so the cookie decides.
  const first = window.location.pathname.split("/")[1];
  const path = (LOCALES as readonly string[]).includes(first) ? window.location.pathname.slice(first.length + 1) || "/" : window.location.pathname;
  window.location.assign(path + window.location.search);
}

// The globe button in the top corner: language, and pounds or dollars.
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

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${t.nav.language}: ${LANGUAGES[locale].name}`}
        className="flex h-10 items-center gap-1.5 rounded-full border-2 border-ink bg-paper px-2.5 text-sm font-bold transition hover:bg-white"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
        </svg>
        <span className="uppercase">{locale}</span>
      </button>
      {open && (
        <div className="sheet absolute end-0 top-12 z-50 w-56 overflow-hidden p-1.5">
          <ul role="listbox" aria-label={t.nav.language}>
            {LOCALES.map((l) => (
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
          <div className="mt-1.5 border-t-2 border-dashed border-ink/15 px-2 pb-1 pt-2.5">
            <p className="text-xs font-bold text-ink/55">{t.common.currency}</p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5" dir="ltr">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => chooseCurrency(c)}
                  aria-pressed={c === currency}
                  className={`rounded-full border-2 py-1.5 text-sm font-bold transition ${c === currency ? "border-ink bg-ink text-paper" : "border-ink/15 hover:border-ink"}`}
                >
                  {c === "gbp" ? "£ GBP" : "$ USD"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
