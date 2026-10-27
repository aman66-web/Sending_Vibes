"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useI18n } from "@/i18n/client";

// Supabase keeps the session in cookies named sb-<project>-auth-token (split into
// .0, .1… when long). Their presence is enough to show "My cards" instead of "Sign in".
const signedIn = () => /(?:^|;\s*)sb-[^=]+-auth-token(?:\.\d+)?=/.test(document.cookie);
const noop = () => () => {};

export function AccountLink() {
  const { t } = useI18n();
  const isIn = useSyncExternalStore(noop, signedIn, () => false);
  const label = isIn ? t.account.myCards : t.account.signIn;
  return (
    <Link
      href="/account"
      aria-label={label}
      title={label}
      className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper transition hover:bg-cream"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
      </svg>
      {isIn && <span aria-hidden className="absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-ink bg-air" />}
    </Link>
  );
}
