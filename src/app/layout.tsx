import type { Metadata, Viewport } from "next";
import { Caveat, Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const display = Fredoka({ subsets: ["latin"], variable: "--font-display-face", weight: ["500", "600", "700"] });
const body = Nunito({ subsets: ["latin"], variable: "--font-body" });
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand-face" });

export const metadata: Metadata = {
  title: "Sending Vibes: interactive cards they'll actually remember",
  description:
    "Send an interactive card for Valentine's, Diwali, birthdays and more. Runaway No buttons, mini games, your photos, and a big finale.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e11d63",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body className={`${display.variable} ${body.variable} ${hand.variable} antialiased`}>{children}</body>
    </html>
  );
}
