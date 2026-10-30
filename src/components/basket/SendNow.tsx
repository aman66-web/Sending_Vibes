"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";

type Props = {
  card: string;
  // The thank-you page's Checkout session, which shows it's the buyer; without it, they're signed in.
  session?: string;
  name: string;
  // When it's booked for, written out.
  date: string;
  // What to do once it's gone; the thank-you page reloads its order.
  onSent?: () => void;
};

// "Send it now instead" under a card booked for later: one tap asks to be sure, the next sends
// it (api/cards/[id]/send-now), and the page then shows it as emailed.
export function SendNow({ card, session, name, date, onSent }: Props) {
  const th = useI18n().t.basket.thanks;
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "ask" | "sending" | "failed">("idle");
  // Focus follows the question there and back, so a screen reader (or a keyboard) isn't lost.
  const [back, setBack] = useState(false);

  const send = async () => {
    setStep("sending");
    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(card)}/send-now`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session ? { session } : {}),
      });
      // Already sent (another tab, say) counts too: either way it's on its way.
      if (res.ok || res.status === 409) {
        if (onSent) onSent();
        else router.refresh();
        return;
      }
    } catch {}
    setStep("failed");
  };

  if (step === "ask" || step === "sending") {
    return (
      <div className="mt-3 rounded-2xl border-2 border-ink/15 bg-cream/70 p-4">
        <p tabIndex={-1} autoFocus className="text-lg font-semibold outline-none">
          {fmt(th.sendNowAsk, { name, date })}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={send} disabled={step === "sending"} className="btn btn-red px-6 py-3 disabled:opacity-60">
            {step === "sending" ? th.sendingNow : th.sendNowYes}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("idle");
              setBack(true);
            }}
            disabled={step === "sending"}
            className="btn btn-paper px-6 py-3 disabled:opacity-60"
          >
            {th.sendNowNo}
          </button>
        </div>
      </div>
    );
  }
  return (
    <>
      {step === "failed" && (
        <p role="alert" className="mt-3 font-semibold text-hot">
          {th.sendNowFailed}
        </p>
      )}
      <button
        type="button"
        autoFocus={back}
        // Several booked cards on one page: say whose this is.
        aria-label={`${th.sendNow}: ${name}`}
        onClick={() => setStep("ask")}
        className="mt-3 inline-flex min-h-12 items-center rounded-full border-2 border-ink bg-paper px-5 text-base font-semibold shadow-[3px_3px_0_0_var(--color-ink)] transition hover:-translate-y-0.5"
      >
        ✉️ {th.sendNow}
      </button>
    </>
  );
}
