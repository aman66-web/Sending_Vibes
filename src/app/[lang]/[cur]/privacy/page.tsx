import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/InfoPage";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.privacy.metaTitle, description: t.privacy.metaDescription, alternates: { canonical: "/privacy" } };
}

export default async function PrivacyPage() {
  const { t } = await getI18n();
  return (
    <InfoPage title={t.privacy.title} intro={t.privacy.intro}>
      {t.privacy.sections.map((section) => (
        <InfoSection key={section.title} title={section.title}>
          {section.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {"list" in section && section.list && (
            <ul>
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {"after" in section && section.after && <p>{section.after}</p>}
        </InfoSection>
      ))}
    </InfoPage>
  );
}
