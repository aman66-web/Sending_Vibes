"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useI18n } from "@/i18n/client";
import { basketSnapshot, onBasketChange } from "@/lib/basket";

const count = () => basketSnapshot().length;

// The bag in the header, with how many cards are waiting in it.
export function BasketLink() {
  const { t } = useI18n();
  const n = useSyncExternalStore(onBasketChange, count, () => 0);
  return (
    <Link
      href="/basket"
      aria-label={n ? `${t.nav.basket} (${n})` : t.nav.basket}
      className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper transition hover:bg-cream"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" />
        <path d="M9 10V7a3 3 0 0 1 6 0v3" />
      </svg>
      {n > 0 && (
        <span className="absolute -end-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full border-2 border-ink bg-hot px-1 text-[11px] font-bold leading-none text-white">
          {n}
        </span>
      )}
    </Link>
  );
}
