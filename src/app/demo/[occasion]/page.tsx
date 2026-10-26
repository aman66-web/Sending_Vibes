import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardPlayer } from "@/components/card/CardPlayer";
import { OCCASIONS, type Occasion } from "@/lib/card";
import { buildTemplate, occasions } from "@/lib/templates";

type Props = { params: Promise<{ occasion: string }> };

const isOccasion = (o: string): o is Occasion => (OCCASIONS as readonly string[]).includes(o);

export function generateStaticParams() {
  return OCCASIONS.map((occasion) => ({ occasion }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { occasion } = await params;
  return isOccasion(occasion) ? { title: `${occasions[occasion].label} demo · Sending Vibes` } : {};
}

export default async function DemoPage({ params }: Props) {
  const { occasion } = await params;
  if (!isOccasion(occasion)) notFound();
  const card = buildTemplate(occasion, "Priya", "Sam");
  return <CardPlayer card={card} />;
}
