import type { Metadata } from "next";
import { ClientCreator } from "@/components/create/ClientCreator";
import { getI18n } from "@/i18n/server";
import { OCCASIONS, THEMES, type Occasion, type ThemeName } from "@/lib/card";

export async function generateMetadata(): Promise<Metadata> {
  // ?occasion= and ?template= links all count as the one page.
  return { title: (await getI18n()).t.create.metaTitle, alternates: { canonical: "/create" } };
}

type Search = { occasion?: string; template?: string; to?: string; from?: string; theme?: string; start?: string; resume?: string; error?: string };

export default async function CreatePage({ searchParams }: { searchParams: Promise<Search> }) {
  const { occasion, template, to, from, theme, start, resume, error } = await searchParams;
  const initial = OCCASIONS.find((o) => o === occasion) as Occasion | undefined;
  const initialTheme = THEMES.find((x) => x === theme) as ThemeName | undefined;
  return (
    <ClientCreator
      initialOccasion={initial}
      initialTemplate={template}
      initialTo={to?.slice(0, 40)}
      initialFrom={from?.slice(0, 40)}
      initialTheme={initialTheme}
      initialStart={start === "custom" || start === "premade" ? start : undefined}
      resume={resume === "1"}
      signInFailed={error === "signin"}
    />
  );
}
