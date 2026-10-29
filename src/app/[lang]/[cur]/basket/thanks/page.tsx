import type { Metadata } from "next";
import Link from "next/link";
import { NextOccasions } from "@/components/basket/NextOccasions";
import { SendCard } from "@/components/basket/SendCard";
import { ClearBasket } from "@/components/basket/ShareLink";
import { Flourish } from "@/components/card/ornaments";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LANGUAGES, fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { getTemplate } from "@/lib/catalog";
import { cardStatus, sendsItself } from "@/lib/delivery";
import { emailReady } from "@/lib/email";
import { fulfilSession, type Fulfilment } from "@/lib/orders";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.basket.thanks.metaTitle, robots: { index: false, follow: false } };
}

type Props = { searchParams: Promise<{ session_id?: string }> };

// Stripe sends the buyer here after paying. The webhook may not have arrived yet,
// so this checks the payment itself and finishes the order if needed. Once it's paid
// the links always show, whatever happened to the emails.
export default async function ThanksPage({ searchParams }: Props) {
  const { t, locale } = await getI18n();
  const th = t.basket.thanks;
  const { session_id } = await searchParams;
  let result: Fulfilment | null = null;
  let failed = false;
  try {
    result = session_id ? await fulfilSession(session_id) : null;
  } catch (e) {
    console.error("Could not finish order", e);
    failed = true;
  }

  const date = (sendOn: string) => sendOn && new Intl.DateTimeFormat(LANGUAGES[locale].tag, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${sendOn}T12:00:00Z`));

  let body: React.ReactNode;
  if (result?.state === "paid") {
    const { order } = result;
    const cards = order.items.map((item) => ({ item, status: cardStatus(item), design: getTemplate(item.template) }));
    const receiptFailed = order.items.some((i) => i.receipt && !i.receipt.ok);
    body = (
      <>
        <ClearBasket ids={order.items.map((i) => i.cardId)} />
        <h1 className="font-brand text-5xl font-bold leading-tight">{th.title}</h1>
        <p className="mt-3 text-lg text-ink/70">{th.intro}</p>
        <p className="mt-2 text-ink/60">{order.buyerEmail && emailReady() && !receiptFailed ? fmt(th.receipt, { email: order.buyerEmail }) : th.keepLinks}</p>
        <span className="mt-6 block text-hot">
          <Flourish />
        </span>
        {cards.some((c) => sendsItself(c.status)) && (
          <div className="mt-6">
            <h2 className="font-brand text-2xl font-bold">{th.howTitle}</h2>
            <ol className="mt-3 space-y-2">
              {th.how.map((step, i) => (
                <li key={step} className="flex items-start gap-3 text-lg">
                  <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-bold text-paper">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <ul className="mt-6 space-y-5">
          {cards.map(({ item, status, design }) => (
            <li key={item.cardId} className="sheet p-5 sm:p-6">
              <p dir="auto" className="font-brand text-2xl font-bold leading-tight">
                {fmt(t.email.cardFor, { to: item.to, from: item.from })}
              </p>
              <SendCard url={`${order.site}/c/${item.cardId}`} to={item.to} from={item.from} status={status} email={item.email} date={date(item.sendOn ?? item.sendAt?.slice(0, 10) ?? "")} />
              {design && (
                <p className="mt-5 border-t-2 border-dashed border-ink/15 pt-2">
                  <Link
                    href={`/create?template=${design.slug}${item.theme ? `&theme=${item.theme}` : ""}&from=${encodeURIComponent(item.from)}`}
                    className="inline-flex min-h-11 items-center font-semibold underline decoration-hot decoration-2 underline-offset-4"
                  >
                    {th.sameDesign} →
                  </Link>
                </p>
              )}
            </li>
          ))}
        </ul>
        <NextOccasions from={order.items[0]?.from ?? ""} />
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/create" className="btn btn-red inline-flex w-full px-6 py-3 sm:w-auto">
            {th.more}
          </Link>
          <Link href="/account" className="btn btn-paper inline-flex w-full px-6 py-3 sm:w-auto">
            {th.allCards}
          </Link>
        </div>
      </>
    );
  } else {
    const message = failed ? th.checkFailed : result?.state === "finishing" ? th.finishing : result ? th.processing : th.notFound;
    body = (
      <div className="sheet p-10 text-center">
        <p className="font-brand text-2xl font-bold">{message}</p>
        {(failed || result) && (
          <Link href={`/basket/thanks?session_id=${encodeURIComponent(session_id ?? "")}`} className="btn btn-red mt-6 inline-flex px-6 py-3">
            {th.refresh}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grain min-h-dvh overflow-x-clip bg-cream text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6">{body}</main>
      <SiteFooter />
    </div>
  );
}
