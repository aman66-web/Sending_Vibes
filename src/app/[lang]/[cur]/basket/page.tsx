import type { Metadata } from "next";
import { Basket } from "@/components/basket/Basket";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getI18n } from "@/i18n/server";
import { emailReady } from "@/lib/email";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.basket.metaTitle, robots: { index: false, follow: false } };
}

export default async function BasketPage() {
  const { t } = await getI18n();
  return (
    <div className="grain min-h-dvh overflow-x-clip bg-cream text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-12 sm:px-6">
        <h1 className="font-brand text-5xl font-bold leading-tight">{t.basket.title}</h1>
        <Basket emailReady={emailReady()} />
      </main>
      <SiteFooter />
    </div>
  );
}
