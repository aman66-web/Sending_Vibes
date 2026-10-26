import { ImageResponse } from "next/og";
import { OgEnvelope } from "@/components/OgEnvelope";
import { getCard } from "@/lib/storage";
import { themes } from "@/lib/themes";

export const alt = "You've been sent an interactive card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The preview shown in WhatsApp / iMessage. It keeps the surprise: only the sender's name.
export default async function CardOgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await getCard(id);
  const theme = themes[card?.theme ?? "rose"];

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
          background: theme.background,
          color: theme.text,
        }}
      >
        <OgEnvelope size={300} />
        <div style={{ fontSize: 72, fontWeight: 800, marginTop: 36, textAlign: "center", padding: "0 60px" }}>
          {card ? `${card.from} sent you something` : "You've got mail"}
        </div>
        <div style={{ fontSize: 34, marginTop: 14, color: theme.muted }}>Tap to open your interactive card</div>
      </div>
    ),
    size,
  );
}
