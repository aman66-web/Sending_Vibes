"use client";

import Link from "next/link";
import { ShareLink } from "@/components/basket/ShareLink";
import { LANGUAGES, fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { sendsItself, type CardStatus } from "@/lib/delivery";
import type { ThemeName } from "@/lib/card";

// What the account API adds to each card about getting it to them. Optional, so an older
// response (a tab left open over an update) still shows.
export type Delivery = { status?: CardStatus; template?: string; custom?: boolean };

type Props = { card: { id: string; to: string; from: string; theme: ThemeName; email?: string; sendOn?: string } & Delivery };

// Under each card on the account page: how it's reaching them, the way to send it, and one
// tap to start the next one.
export function CardActions({ card }: Props) {
  const { t, locale } = useI18n();
  const th = t.basket.thanks;
  const url = `${window.location.origin}/c/${card.id}`;
  const status = card.status ?? (card.email ? "emailed" : "self");
  const email = card.email ?? "";
  const day = (sendOn: string) => sendOn && new Intl.DateTimeFormat(LANGUAGES[locale].tag, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${sendOn}T12:00:00Z`));

  const line =
    status === "scheduled"
      ? fmt(th.emailLater, { email, date: day(card.sendOn ?? "") })
      : status === "emailed"
        ? `✓ ${fmt(th.emailNow, { email })}`
        : status === "failed" || status === "retrying"
          ? fmt(status === "failed" ? th.emailFailed : th.emailRetrying, { email, name: card.to })
          : null;
  const names = `to=${encodeURIComponent(card.to)}&from=${encodeURIComponent(card.from)}`;

  return (
    <>
      {line && <p className={`mt-4 font-semibold ${sendsItself(status) ? "text-hot" : "text-ink/75"}`}>{line}</p>}
      {sendsItself(status) ? (
        <ShareLink url={url} to={card.to} from={card.from} compact />
      ) : (
        // Already on its way, so the link is tucked away rather than offered first.
        <details className="mt-2">
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-ink/70 underline underline-offset-4">{th.sendYourself}</summary>
          <ShareLink url={url} to={card.to} from={card.from} compact />
        </details>
      )}
      <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-dashed border-ink/15 pt-4">
        {/* The same kind of card as before: made from scratch, or from a design. */}
        <Link href={`/create?start=${card.custom ? "custom" : "premade"}&${names}`} className="btn btn-paper px-5 py-2.5">
          {fmt(t.account.makeAnother, { name: card.to })}
        </Link>
        {card.template && (
          <Link href={`/create?template=${card.template}&theme=${card.theme}&from=${encodeURIComponent(card.from)}`} className="btn btn-paper px-5 py-2.5">
            {th.sameDesign}
          </Link>
        )}
      </div>
    </>
  );
}
