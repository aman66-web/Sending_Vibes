import { Waiting } from "@/components/basket/PaymentWait";
import { SiteHeader } from "@/components/SiteHeader";
import { getI18n } from "@/i18n/server";

// Straight back from paying, while the page checks the payment with Stripe and sends the
// emails: the same loading screen it shows if it has to keep checking (PaymentWait).
export default async function Loading() {
  const { t } = await getI18n();
  return (
    <div className="grain min-h-dvh overflow-x-clip bg-cream text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6">
        <Waiting title={t.basket.thanks.waitTitle} hint={t.basket.thanks.waitHint} />
      </main>
    </div>
  );
}
