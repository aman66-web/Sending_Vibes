import type { Metadata } from "next";
import { ClientCreator } from "@/components/create/ClientCreator";
import { OCCASIONS, type Occasion } from "@/lib/card";

export const metadata: Metadata = { title: "Make a card · Sending Vibes" };

export default async function CreatePage({ searchParams }: { searchParams: Promise<{ occasion?: string }> }) {
  const { occasion } = await searchParams;
  const initial = OCCASIONS.find((o) => o === occasion) as Occasion | undefined;
  return <ClientCreator initialOccasion={initial} />;
}
