"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";

// Checks again every few seconds, for about a minute and a half, before saying it's taking longer.
const TRIES = 30;
const EVERY = 3000;

// The thank-you page while a payment is being confirmed (or the order couldn't be checked for
// a moment): a loading screen that checks again by itself, reloading the page's order, until
// the cards are ready. If it takes longer than that, it says why and offers Check again.
export function PaymentWait({ message }: { message: string }) {
  const th = useI18n().t.basket.thanks;
  const router = useRouter();
  const [tries, setTries] = useState(0);
  const waiting = tries < TRIES;

  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(
      () => {
        setTries((n) => n + 1);
        router.refresh();
      },
      tries === 0 ? 1500 : EVERY,
    );
    return () => clearTimeout(timer);
  }, [tries, waiting, router]);

  if (waiting) {
    return (
      <div role="status" className="sheet px-6 py-12 text-center sm:px-10">
        <div aria-hidden className="relative mx-auto mb-6 grid h-24 w-24 place-items-center">
          <span className="absolute inset-0 rounded-full border-4 border-ink/10 border-t-hot motion-safe:animate-spin" />
          <span className="text-4xl motion-safe:animate-pulse">💌</span>
        </div>
        <p className="font-brand text-3xl font-bold">{th.waitTitle}</p>
        <p className="mt-3 text-lg text-ink/65">{th.waitHint}</p>
      </div>
    );
  }
  return (
    <div className="sheet p-10 text-center">
      <p className="font-brand text-2xl font-bold">{message}</p>
      <button
        type="button"
        onClick={() => {
          setTries(0);
          router.refresh();
        }}
        className="btn btn-red mt-6 inline-flex px-6 py-3"
      >
        {th.refresh}
      </button>
    </div>
  );
}
