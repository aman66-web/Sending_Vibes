import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CardPlayer } from "@/components/card/CardPlayer";
import { OpenedBeacon } from "@/components/card/OpenedBeacon";
import { InfoPage } from "@/components/InfoPage";
import { cardEnvelopeLook } from "@/components/OgCardEnvelope";
import { getI18n } from "@/i18n/server";
import { currentAccount } from "@/lib/auth";
import { emailReady } from "@/lib/email";
import { isBuyer, senderOf } from "@/lib/notify";
import { getCard } from "@/lib/storage";
import { occasions } from "@/lib/templates";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) return { title: "Card not found" };
  if (!card.paid) return { title: (await getI18n()).t.pending.title, robots: { index: false, follow: false } };
  // Shown in the WhatsApp / iMessage link preview. Keep the surprise, so no card content here.
  const title = `${card.to}, ${card.from} sent you something ${occasions[card.occasion].emoji}`;
  const description = "Tap to open your interactive card. It's best with the sound on.";
  return {
    title,
    description,
    // Messenger, Telegram and Facebook read these rather than the page's title.
    openGraph: { title, description, type: "website", siteName: "Envelette" },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: false, follow: false },
  };
}

// The phone's browser bar in the colour the card opens in.
export async function generateViewport({ params }: Props): Promise<Viewport> {
  const card = await getCard((await params).id).catch(() => null);
  return card?.paid ? { themeColor: cardEnvelopeLook(card).top } : {};
}

export default async function CardPage({ params }: Props) {
  const { id } = await params;
  // Who bought it is looked up alongside, to know whether a thank-you can reach them, and
  // whether this is them looking at their own card.
  const [card, sender, account] = await Promise.all([
    getCard(id),
    senderOf(id).catch((e) => {
      console.error("Could not find who sent a card", e);
      return null;
    }),
    currentAccount().catch(() => null),
  ]);
  if (!card) notFound();
  const { t } = await getI18n();
  // Still in someone's basket: the link exists but the card stays shut until it's paid for.
  if (!card.paid) {
    return (
      <InfoPage title={t.pending.title} intro={t.pending.body}>
        <Link href="/basket" className="btn btn-red inline-flex px-6 py-3">
          {t.pending.cta}
        </Link>
      </InfoPage>
    );
  }
  return (
    <>
      <CardPlayer
        card={card}
        recipient={{
          cardId: card.id,
          text: t.reply,
          canReply: emailReady() && Boolean(sender?.order.buyerEmail),
          own: Boolean(account && sender && isBuyer(sender.order, account)),
        }}
      />
      <OpenedBeacon cardId={card.id} hasEnvelope={card.screens.some((s) => s.type === "intro")} />
    </>
  );
}
