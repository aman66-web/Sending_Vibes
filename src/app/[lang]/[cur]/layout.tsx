import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Caveat,
  Courier_Prime,
  Creepster,
  Dancing_Script,
  Figtree,
  Fraunces,
  Fredoka,
  Noto_Sans_Arabic,
  Noto_Sans_Bengali,
  Noto_Sans_Devanagari,
  Noto_Sans_Gujarati,
  Noto_Sans_Gurmukhi,
  Permanent_Marker,
  Playfair_Display,
} from "next/font/google";
import { ChatWidget } from "@/components/ChatWidget";
import { I18nProvider } from "@/i18n/client";
import { LANGUAGES } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { COMMON_CURRENCIES } from "@/lib/pricing";
import "../../globals.css";

// The site itself: a soft serif for headings and a plain sans for everything else.
const brand = Fraunces({ subsets: ["latin"], variable: "--font-brand-face", axes: ["SOFT", "WONK", "opsz"] });
const ui = Figtree({ subsets: ["latin"], variable: "--font-ui-face" });
// Inside the cards: a classic high-contrast serif, like good printed stationery.
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display-face", style: ["normal", "italic"] });
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand-face" });
// Fonts a card's screens can ask for (see lib/screen-style.ts). Not preloaded, so only
// a card that uses one downloads it.
const script = Dancing_Script({ subsets: ["latin"], variable: "--font-script-face", preload: false });
const rounded = Fredoka({ subsets: ["latin"], variable: "--font-rounded-face", preload: false });
const bold = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bold-face", preload: false });
const typewriter = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-typewriter-face", preload: false });
const marker = Permanent_Marker({ subsets: ["latin"], weight: "400", variable: "--font-marker-face", preload: false });
const spooky = Creepster({ subsets: ["latin"], weight: "400", variable: "--font-spooky-face", preload: false });
// Other scripts, used only where a page has those letters. Browsers download a
// font only when it has characters on screen, so English pages don't pay for them.
const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-devanagari", preload: false });
const gurmukhi = Noto_Sans_Gurmukhi({ subsets: ["gurmukhi"], variable: "--font-gurmukhi", preload: false });
const gujarati = Noto_Sans_Gujarati({ subsets: ["gujarati"], variable: "--font-gujarati", preload: false });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bengali", preload: false });
const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic", preload: false });

const fonts = [brand, ui, display, hand, script, rounded, bold, typewriter, marker, spooky, devanagari, gurmukhi, gujarati, bengali, arabic].map((f) => f.variable).join(" ");

// English pages are built ahead of time in the most common currencies; other languages
// and currencies are built on first visit and then kept.
export function generateStaticParams() {
  return COMMON_CURRENCIES.map((cur) => ({ lang: "en", cur }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://envelette.com"),
    title: t.meta.title,
    description: t.meta.description,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3ecdf",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { locale, currency, t } = await getI18n();
  const { tag, dir } = LANGUAGES[locale];
  return (
    <html lang={tag} dir={dir}>
      <body className={`${fonts} antialiased`}>
        <I18nProvider locale={locale} currency={currency} t={t}>
          {children}
          {/* The chat only shows once the Claude API key has been added. */}
          {process.env.ANTHROPIC_API_KEY ? <ChatWidget /> : null}
        </I18nProvider>
      </body>
    </html>
  );
}
