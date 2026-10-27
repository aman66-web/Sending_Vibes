import type { Metadata } from "next";
import { ClientCreator } from "@/components/create/ClientCreator";
import { getI18n } from "@/i18n/server";
import { OCCASIONS, THEMES, type Occasion, type ThemeName } from "@/lib/card";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).t.create.metaTitle };
}

type Search = { occasion?: string; template?: string; to?: string; from?: string; theme?: string };

export default async function CreatePage({ searchParams }: { searchParams: Promise<Search> }) {
  const { occasion, template, to, from, theme } = await searchParams;
  const initial = OCCASIONS.find((o) => o === occasion) as Occasion | undefined;
  const initialTheme = THEMES.find((x) => x === theme) as ThemeName | undefined;
  return (
    <ClientCreator
      initialOccasion={initial}
      initialTemplate={template}
      initialTo={to?.slice(0, 40)}
      initialFrom={from?.slice(0, 40)}
      initialTheme={initialTheme}
    />
  );
}
