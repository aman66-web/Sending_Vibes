"use client";

import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { CardStatus } from "@/lib/delivery";
import { SendNow } from "./SendNow";
import { ShareLink } from "./ShareLink";

// A green tick and what's happening, for a card that needs nothing more from the buyer.
export function Done({ text }: { text: string }) {
  return (
    <p className="mt-3 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-lg font-semibold text-emerald-950 ring-1 ring-emerald-200">
      <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-base text-white">
        ✓
      </span>
      <span className="min-w-0 pt-0.5 [overflow-wrap:anywhere]">{text}</span>
    </p>
  );
}

// `email` is everyone it's going to (or, if it couldn't be emailed, who it didn't reach),
// already written as a list. `sendNow` offers sending a booked card straight away.
type Props = { url: string; to: string; from: string; status: CardStatus; email?: string; date?: string; sendNow?: { card: string; session?: string } };

// How a paid card on the thank-you page gets to them. A card we're emailing just says so,
// with the link tucked away so it isn't sent early and spoils the surprise. The rest get
// the big Send button, and a look at what the person will see in their chat.
export function SendCard({ url, to, from, status, email = "", date = "", sendNow }: Props) {
  const th = useI18n().t.basket.thanks;

  if (status === "scheduled" || status === "emailed") {
    return (
      <>
        <Done text={status === "scheduled" ? fmt(th.scheduledDone, { email, date }) : fmt(th.emailedDone, { email })} />
        {status === "scheduled" && sendNow && <SendNow card={sendNow.card} session={sendNow.session} name={to} date={date} />}
        <details className="mt-2">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-ink/70 underline underline-offset-4">{th.sendYourself}</summary>
          <ShareLink url={url} to={to} from={from} compact />
        </details>
      </>
    );
  }

  const note = status === "failed" ? th.emailFailed : status === "retrying" ? th.emailRetrying : th.selfNote;
  return (
    <>
      <p className={`mt-1 ${status === "self" ? "text-ink/65" : "font-semibold text-hot"}`}>{fmt(note, { email, name: to })}</p>
      <figure className="mt-4 max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- the card's own link preview, drawn on demand */}
        <img src={`${url}/opengraph-image`} alt="" width={1200} height={630} loading="lazy" className="block h-auto w-full rounded-xl border-2 border-ink/15 bg-cream" />
        <figcaption className="mt-1.5 text-sm text-ink/60">{fmt(th.preview, { name: to })}</figcaption>
      </figure>
      <ShareLink url={url} to={to} from={from} />
    </>
  );
}
