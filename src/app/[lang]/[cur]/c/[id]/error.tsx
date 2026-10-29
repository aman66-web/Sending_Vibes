"use client";

import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/i18n/client";
import { isStaleCode, reportCaught, tryAgain } from "@/lib/report-error";

// Someone opening a card they were sent, when it didn't load (a weak signal, or the
// database slow for a moment). Reassure them it's still there and let them try again.
// It tries once more by itself after a few seconds, since that's usually all it needs.
let triedAlready = false;

export default function CardError({ error, retry }: { error: unknown; retry: () => void }) {
  const { t } = useI18n();
  const e = t.notFound.errors;

  useEffect(() => {
    reportCaught(error);
    // A newer version of the site needs the page loaded afresh, which is for them to choose.
    if (triedAlready || isStaleCode(error)) return;
    const timer = setTimeout(() => {
      triedAlready = true;
      retry();
    }, 3000);
    return () => clearTimeout(timer);
  }, [error, retry]);

  return (
    <main className="grain flex min-h-dvh flex-col items-center justify-center bg-cream px-4 py-16 text-center text-ink">
      <div aria-hidden className="text-8xl motion-safe:animate-bob">
        💌
      </div>
      <h1 className="mt-6 font-brand text-4xl font-bold sm:text-5xl">{e.cardTitle}</h1>
      <p className="mt-4 max-w-md text-lg leading-relaxed text-ink/70">{e.cardBody}</p>
      <button type="button" onClick={() => tryAgain(error, retry)} className="btn btn-red mt-8 px-10 py-4 text-xl">
        {e.retry}
      </button>
      <p className="mt-6 max-w-sm text-base text-ink/60">{e.cardLater}</p>
      <div className="mt-14">
        <Logo />
      </div>
    </main>
  );
}
