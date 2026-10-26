import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CardPlayer } from "@/components/card/CardPlayer";
import { TEMPLATES, buildTemplateDemo, getTemplate } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getTemplate((await params).slug);
  return t ? { title: `${t.name} (demo) · Sending Vibes` } : {};
}

// Full-screen demo of a design, exactly as a recipient would see it.
export default async function PlayPage({ params }: Props) {
  const t = getTemplate((await params).slug);
  if (!t) notFound();
  return <CardPlayer card={buildTemplateDemo(t)} />;
}
