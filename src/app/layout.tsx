import type { Metadata, Viewport } from "next";
import { Caveat, Fredoka, Instrument_Serif, Nunito } from "next/font/google";
import { ChatWidget } from "@/components/ChatWidget";
import "./globals.css";

const display = Fredoka({ subsets: ["latin"], variable: "--font-display-face", weight: ["500", "600", "700"] });
const body = Nunito({ subsets: ["latin"], variable: "--font-body" });
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand-face" });
const serif = Instrument_Serif({ subsets: ["latin"], variable: "--font-serif-face", weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sending-vibes.vercel.app"),
  title: "Sending Vibes: personalised interactive cards they'll actually remember",
  description:
    "Personalised interactive cards for birthdays, Valentine's, Diwali, Eid, Christmas, Halloween and more. Runaway No buttons, mini games, your photos, music and a big finale. Just fill in the blanks.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ff2e7e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body className={`${display.variable} ${body.variable} ${hand.variable} ${serif.variable} antialiased`}>
        {children}
        {/* The chat only shows once the Claude API key has been added. */}
        {process.env.ANTHROPIC_API_KEY ? <ChatWidget /> : null}
      </body>
    </html>
  );
}
