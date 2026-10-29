"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CardActions, type Delivery } from "@/components/account/CardActions";
import { SignIn } from "@/components/SignIn";
import { Motif } from "@/components/card/motifs";
import { LANGUAGES, fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { Occasion, ThemeName } from "@/lib/card";
import { themes } from "@/lib/themes";

type Card = { id: string; to: string; from: string; paidAt: string; occasion: Occasion; theme: ThemeName; email?: string; sendOn?: string };
type State = { enabled: boolean; google: boolean; email: boolean; account: { email: string | null; name: string | null } | null; cards: (Card & Delivery)[]; error?: boolean };

// The signed-in buyer's cards, or a way to sign in (Google or an emailed code).
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
          <div className="mx-auto mt-6 max-w-sm text-start">
            <SignIn google={state.google} email={state.email} next="/account" onSignedIn={() => window.location.reload()} />
          </div>
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
                <CardActions card={card} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
