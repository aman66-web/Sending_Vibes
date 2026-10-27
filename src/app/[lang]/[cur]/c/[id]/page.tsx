import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardPlayer } from "@/components/card/CardPlayer";
import { InfoPage } from "@/components/InfoPage";
import { getI18n } from "@/i18n/server";
import { getCard } from "@/lib/storage";
import { occasions } from "@/lib/templates";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) return { title: "Card not found" };
  if (!card.paid) return { title: (await getI18n()).t.pending.title, robots: { index: false, follow: false } };
  // Shown in the WhatsApp / iMessage link preview. Keep the surprise, so no card content here.
  return {
    title: `${card.from} sent you something ${occasions[card.occasion].emoji}`,
    description: "Tap to open your interactive card.",
    robots: { index: false, follow: false },
  };
}

export default async function CardPage({ params }: Props) {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) notFound();
  // Still in someone's basket: the link exists but the card stays shut until it's paid for.
  if (!card.paid) {
    const { t } = await getI18n();
    return (
      <InfoPage title={t.pending.title} intro={t.pending.body}>
        <Link href="/basket" className="btn btn-red inline-flex px-6 py-3">
          {t.pending.cta}
        </Link>
      </InfoPage>
    );
  }
  return <CardPlayer card={card} />;
}
