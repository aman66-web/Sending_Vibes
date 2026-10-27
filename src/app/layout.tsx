import type { Metadata, Viewport } from "next";
import { Caveat, Figtree, Fraunces, Fredoka, Nunito } from "next/font/google";
import { ChatWidget } from "@/components/ChatWidget";
import "./globals.css";

// The site itself: a soft serif for headings and a plain sans for everything else.
const brand = Fraunces({ subsets: ["latin"], variable: "--font-brand-face", axes: ["SOFT", "WONK", "opsz"] });
const ui = Figtree({ subsets: ["latin"], variable: "--font-ui-face" });
// Inside the cards: rounded and playful.
const display = Fredoka({ subsets: ["latin"], variable: "--font-display-face", weight: ["500", "600", "700"] });
const body = Nunito({ subsets: ["latin"], variable: "--font-body" });
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand-face" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sending-vibes.vercel.app"),
  title: "Sending Vibes: personalised interactive cards they'll actually remember",
  description:
    "Personalised interactive cards for birthdays, Valentine's, Diwali, Eid, Christmas, Halloween and more. Runaway No buttons, mini games, your photos, music and a big finale. Just fill in the blanks.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3ecdf",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body className={`${brand.variable} ${ui.variable} ${display.variable} ${body.variable} ${hand.variable} antialiased`}>
        {children}
        {/* The chat only shows once the Claude API key has been added. */}
        {process.env.ANTHROPIC_API_KEY ? <ChatWidget /> : null}
      </body>
    </html>
  );
}
