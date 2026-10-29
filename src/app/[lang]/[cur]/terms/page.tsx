import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/InfoPage";
import { RichText } from "@/components/RichText";
import { CONTACT_EMAIL, TERMS } from "@/lib/terms";

// The terms agreed to at checkout. In English for everyone, as the version that applies.

export const metadata: Metadata = { title: TERMS.metaTitle, description: TERMS.metaDescription, alternates: { canonical: "/terms" } };

// The contact email, as a link to write to it.
function WithEmail({ text }: { text: string }) {
  const [before, after] = text.split(CONTACT_EMAIL);
  if (after === undefined) return <RichText text={text} />;
  return (
    <>
      <RichText text={before} />
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      <RichText text={after} />
    </>
  );
}

export default function TermsPage() {
  return (
    <InfoPage title={TERMS.title} intro={TERMS.intro}>
      {TERMS.sections.map((section) => (
        <InfoSection key={section.title} title={section.title}>
          {section.paragraphs.map((p) => (
            <p key={p} lang="en">
              <WithEmail text={p} />
            </p>
          ))}
        </InfoSection>
      ))}
      <p className="text-sm text-ink/55">{TERMS.updated}</p>
    </InfoPage>
  );
}
