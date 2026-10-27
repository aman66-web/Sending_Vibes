import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardPlayer } from "@/components/card/CardPlayer";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { OCCASIONS, type Occasion } from "@/lib/card";
import { buildDemo } from "@/lib/templates";

type Props = { params: Promise<{ occasion: string }> };

const isOccasion = (o: string): o is Occasion => (OCCASIONS as readonly string[]).includes(o);

export function generateStaticParams() {
  return OCCASIONS.map((occasion) => ({ occasion }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { occasion } = await params;
  if (!isOccasion(occasion)) return {};
  const { t } = await getI18n();
  return { title: fmt(t.common.demoTitle, { label: t.occasions[occasion].label }) };
}

export default async function DemoPage({ params }: Props) {
  const { occasion } = await params;
  if (!isOccasion(occasion)) notFound();
  const card = buildDemo(occasion);
  return <CardPlayer card={card} />;
}
