import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { OgCardEnvelope, cardEnvelopeLook, clip } from "@/components/OgCardEnvelope";
import { OgEnvelope } from "@/components/OgEnvelope";
import { getCard } from "@/lib/storage";
import { themes } from "@/lib/themes";

export const alt = "You've been sent an interactive card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The cards' handwriting and their italic serif, read once. Both are SIL Open Font License
// fonts from Google Fonts (Caveat cut down to Latin letters). If either is missing the
// image still draws, in the default font.
const font = (file: string) => readFile(join(process.cwd(), "src/assets/fonts", file)).catch((e) => (console.error("Link-preview font missing", e), null));
const [caveat, playfair] = await Promise.all([font("Caveat-SemiBold.ttf"), font("PlayfairDisplay-SemiBoldItalic.ttf")]);
const fonts = caveat && playfair
  ? [
      { name: "Caveat", data: caveat, weight: 600 as const, style: "normal" as const },
      { name: "Playfair", data: playfair, weight: 600 as const, style: "italic" as const },
    ]
  : undefined;

// The preview shown in WhatsApp, iMessage, Messenger and Telegram: the card's own sealed
// envelope with their name on it. It keeps the surprise: only the two names, nothing
// from inside the card. A card that's missing or not paid for yet gets the plain one.
export default async function CardOgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await getCard(id).catch(() => null);

  if (!card?.paid) {
    const theme = themes.rose;
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: theme.og, color: theme.text }}>
          <OgEnvelope size={300} />
          <div style={{ fontSize: 72, fontWeight: 800, marginTop: 36 }}>{"You've got mail"}</div>
          <div style={{ fontSize: 34, marginTop: 14, color: theme.muted }}>Tap to open your interactive card</div>
        </div>
      ),
      size,
    );
  }

  const look = cardEnvelopeLook(card);
  const headline = `${clip(card.to)}, ${clip(card.from)} sent you something`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 50px",
          background: look.background,
          color: look.text,
          fontFamily: "Playfair",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 1, fontStyle: "italic", color: look.muted }}>{"You've got mail"}</div>
        <div style={{ display: "flex", marginTop: 22 }}>
          <OgCardEnvelope to={card.to} from={card.from} look={look} />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            maxWidth: 1100,
            marginTop: 30,
            fontSize: headline.length <= 34 ? 58 : headline.length <= 46 ? 48 : 40,
            fontStyle: "italic",
            lineHeight: 1.15,
            textAlign: "center",
          }}
        >
          {headline}
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
