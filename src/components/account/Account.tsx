"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShareLink } from "@/components/basket/ShareLink";
import { Motif } from "@/components/card/motifs";
import { LANGUAGES, fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { Occasion, ThemeName } from "@/lib/card";
import { themes } from "@/lib/themes";

type Card = { id: string; to: string; from: string; paidAt: string; occasion: Occasion; theme: ThemeName; email?: string; sendOn?: string };
type State = { enabled: boolean; account: { email: string | null; name: string | null } | null; cards: Card[]; error?: boolean };

// The signed-in buyer's cards, or a button to sign in with Google.
export function Account() {
  const { t, locale } = useI18n();
  const a = t.account;
  const [state, setState] = useState<State | null>(null);
  const [failed, setFailed] = useState(false);
  const [signInError, setSignInError] = useState(false);

  useEffect(() => {
    fetch("/api/account", { cache: "no-store" })
      .then((r) => r.json())
      .then((loaded: State) => {
        setSignInError(new URLSearchParams(window.location.search).get("error") === "signin");
        setState(loaded);
      })
      .catch(() => setFailed(true));
  }, []);

  const signOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" }).catch(() => {});
    window.location.reload();
  };

  if (failed) return <p className="mt-6 font-semibold text-hot">{a.failed}</p>;
  if (!state) return <div className="mt-10 h-40" />;

  if (!state.account) {
    return (
      <div className="sheet mt-8 p-8 text-center sm:p-10">
        <p className="mx-auto max-w-md text-lg text-ink/75">{state.enabled ? a.signInIntro : a.off}</p>
        {state.enabled && (
          // A plain form, so the browser leaves the site for Google's sign-in page.
          <form action="/api/auth/google" method="get">
            <input type="hidden" name="next" value="/account" />
            <button className="btn btn-paper mt-6 inline-flex items-center gap-3 px-6 py-3">
              <GoogleMark />
              {a.google}
            </button>
          </form>
        )}
        {signInError && <p className="mt-4 text-sm font-semibold text-hot">{a.signInFailed}</p>}
        <p className="mt-6 text-sm text-ink/55">{a.noAccountNeeded}</p>
      </div>
    );
  }

  const date = (iso: string) => new Intl.DateTimeFormat(LANGUAGES[locale].tag, { dateStyle: "medium" }).format(new Date(iso));

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink/70">{fmt(a.signedInAs, { email: state.account.email ?? state.account.name ?? "" })}</p>
        <button onClick={signOut} className="text-sm font-semibold text-ink/60 underline-offset-4 hover:text-ink hover:underline">
          {a.signOut}
        </button>
      </div>
      {state.error && <p className="mt-4 font-semibold text-hot">{a.failed}</p>}
      {state.cards.length === 0 ? (
        <div className="sheet mt-8 p-10 text-center">
          <p className="font-brand text-2xl font-bold">{a.empty}</p>
          <p className="mt-2 text-ink/60">{a.emptyHint}</p>
          <Link href="/create" className="btn btn-red mt-6 inline-flex px-6 py-3">
            {t.nav.makeCard}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-5">
          {state.cards.map((card) => {
            const theme = themes[card.theme] ?? themes.ivory;
            return (
              <li key={card.id} className="sheet p-5 sm:p-6">
                <div className="flex gap-4">
                  <div className="relative grid aspect-[4/5] w-16 shrink-0 place-items-center shadow-sm sm:w-20" style={{ background: theme.background, color: theme.accent }}>
                    <div aria-hidden className="absolute inset-[7%] border" style={{ borderColor: theme.muted, opacity: 0.55 }} />
                    <Motif occasion={card.occasion} className="h-8 w-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p dir="auto" className="font-brand text-2xl font-bold leading-tight">
                      {fmt(t.email.cardFor, { to: card.to, from: card.from })}
                    </p>
                    <p className="mt-1 text-sm text-ink/60">{fmt(a.bought, { date: date(card.paidAt) })}</p>
                  </div>
                </div>
                <ShareLink url={`${window.location.origin}/c/${card.id}`} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
