import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardPlayer } from "@/components/card/CardPlayer";
import { DemoPage } from "@/components/DemoBar";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { TEMPLATES, buildTemplateDemo, getTemplate } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getTemplate((await params).slug);
  if (!t) return {};
  const { t: d } = await getI18n();
  // The product page is the one to find in search; this is the same card with nothing around it.
  return { title: fmt(d.demo.metaTitle, { name: t.name }), alternates: { canonical: `/cards/${t.slug}/play` }, robots: { index: false, follow: true } };
}

// Full-screen demo of a design, exactly as a recipient would see it.
export default async function PlayPage({ params }: Props) {
  const t = getTemplate((await params).slug);
  if (!t) notFound();
  return (
    <DemoPage slug={t.slug} back={`/cards/${t.slug}`}>
      <CardPlayer card={buildTemplateDemo(t)} />
    </DemoPage>
  );
}
