import type { Metadata } from "next";
import Link from "next/link";
import { ClearBasket, ShareLink } from "@/components/basket/ShareLink";
import { Flourish } from "@/components/card/ornaments";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LANGUAGES, fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { emailReady } from "@/lib/email";
import { fulfilSession, type Fulfilment } from "@/lib/orders";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.basket.thanks.metaTitle, robots: { index: false, follow: false } };
}

type Props = { searchParams: Promise<{ session_id?: string }> };

// Stripe sends the buyer here after paying. The webhook may not have arrived yet,
// so this checks the payment itself and finishes the order if needed.
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

  const date = (sendOn: string) => new Intl.DateTimeFormat(LANGUAGES[locale].tag, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${sendOn}T12:00:00Z`));

  let body: React.ReactNode;
  if (result?.state === "paid") {
    const { order } = result;
    body = (
      <>
        <ClearBasket ids={order.items.map((i) => i.cardId)} />
        <h1 className="font-brand text-5xl font-bold leading-tight">{th.title}</h1>
        <p className="mt-3 text-lg text-ink/70">{th.intro}</p>
        <p className="mt-2 text-ink/60">{order.buyerEmail && emailReady() ? fmt(th.receipt, { email: order.buyerEmail }) : th.keepLinks}</p>
        <span className="mt-6 block text-hot">
          <Flourish />
        </span>
        <ul className="mt-6 space-y-5">
          {order.items.map((item) => (
            <li key={item.cardId} className="sheet p-5 sm:p-6">
              <p dir="auto" className="font-brand text-2xl font-bold leading-tight">
                {fmt(t.email.cardFor, { to: item.to, from: item.from })}
              </p>
              <p className="mt-1 text-ink/65">
                {item.delivery === "email" && item.email
                  ? item.sendOn
                    ? fmt(th.emailLater, { email: item.email, date: date(item.sendOn) })
                    : fmt(th.emailNow, { email: item.email })
                  : fmt(th.selfNote, { name: item.to })}
              </p>
              <ShareLink url={`${order.site}/c/${item.cardId}`} />
            </li>
          ))}
        </ul>
        <Link href="/create" className="btn btn-red mt-8 inline-flex px-6 py-3">
          {th.more}
        </Link>
      </>
    );
  } else {
    const message = failed ? t.basket.errors.failed : result ? th.processing : th.notFound;
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
