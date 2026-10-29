import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardPlayer } from "@/components/card/CardPlayer";
import { DemoPage } from "@/components/DemoBar";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { OCCASIONS, type Occasion } from "@/lib/card";
import { TEMPLATES, buildTemplateDemo } from "@/lib/catalog";

type Props = { params: Promise<{ occasion: string }> };

const isOccasion = (o: string): o is Occasion => (OCCASIONS as readonly string[]).includes(o);

// The occasion's first design, which is the one its demo shows. A new occasion may not have one yet.
const firstDesign = (o: Occasion) => TEMPLATES.find((t) => t.occasion === o);

export function generateStaticParams() {
  return OCCASIONS.map((occasion) => ({ occasion }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { occasion } = await params;
  if (!isOccasion(occasion)) return {};
  const { t } = await getI18n();
  // Kept out of search: the occasion's own page is the one to find.
  return {
    title: fmt(t.common.demoTitle, { label: t.occasions[occasion].label }),
    alternates: { canonical: `/demo/${occasion}` },
    robots: { index: false, follow: true },
  };
}

export default async function DemoOccasionPage({ params }: Props) {
  const { occasion } = await params;
  const design = isOccasion(occasion) ? firstDesign(occasion) : undefined;
  if (!design) notFound();
  // These demos are opened from the occasions part of the home page.
  return (
    <DemoPage slug={design.slug} back="/#occasions">
      <CardPlayer card={buildTemplateDemo(design)} />
    </DemoPage>
  );
}
