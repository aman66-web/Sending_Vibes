import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardPlayer } from "@/components/card/CardPlayer";
import { getCard } from "@/lib/storage";
import { occasions } from "@/lib/templates";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) return { title: "Card not found" };
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
  return <CardPlayer card={card} />;
}
