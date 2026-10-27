import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Privacy · Sending Vibes",
  description: "What Sending Vibes stores when you make a card, who can see it, and how photos are handled.",
};

export default function PrivacyPage() {
  return (
    <InfoPage title="Your cards, your business" intro="In plain English: what we store when you make a card, who can see it and what we don't do.">
      <InfoSection title="What we store">
        <p>When you create a card we store what you put in it, so it can be shown to the person you send it to:</p>
        <ul>
          <li>the names you type (theirs and yours)</li>
          <li>the words on each screen, your quiz answers, coupons and other text</li>
          <li>any photos you add</li>
          <li>the design, colours, music and effects you chose</li>
        </ul>
        <p>We don&apos;t ask for an account, your email address or your phone number to make a card.</p>
      </InfoSection>
      <InfoSection title="Who can see a card">
        <p>
          Anyone with the card&apos;s link can open it, so only share it with the people you want to see it. Links are long random codes that can&apos;t realistically be
          guessed, and cards are never listed, searchable or shown anywhere else on the site. We also ask search engines not to index them.
        </p>
      </InfoSection>
      <InfoSection title="Photos">
        <p>
          Photos are resized on your own device before they&apos;re uploaded. This also removes hidden data that phones add to photos, such as the location where the
          photo was taken. Uploaded photos are only used in the card you add them to.
        </p>
      </InfoSection>
      <InfoSection title="Things saved on your device">
        <p>
          While you&apos;re making a card, we keep an unfinished copy in your browser&apos;s local storage so a refresh doesn&apos;t lose your work. We also remember whether
          you&apos;ve muted card sounds. This stays on your device; it isn&apos;t sent to us. We don&apos;t use advertising or tracking cookies.
        </p>
      </InfoSection>
      <InfoSection title="Where it's kept">
        <p>The site is hosted by Vercel, and cards and photos are stored with Supabase. They process this data on our behalf to run the site.</p>
      </InfoSection>
      <InfoSection title="Payments">
        <p>When paid cards launch, payments will be handled by a specialist payment provider. We will never see or store your full card details.</p>
      </InfoSection>
    </InfoPage>
  );
}
