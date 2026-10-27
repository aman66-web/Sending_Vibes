import type { Metadata, Viewport } from "next";
import { Caveat, Figtree, Fraunces, Fredoka, Noto_Sans_Arabic, Noto_Sans_Bengali, Noto_Sans_Devanagari, Noto_Sans_Gujarati, Noto_Sans_Gurmukhi, Nunito } from "next/font/google";
import { ChatWidget } from "@/components/ChatWidget";
import { I18nProvider } from "@/i18n/client";
import { LANGUAGES } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import "../../globals.css";

// The site itself: a soft serif for headings and a plain sans for everything else.
const brand = Fraunces({ subsets: ["latin"], variable: "--font-brand-face", axes: ["SOFT", "WONK", "opsz"] });
const ui = Figtree({ subsets: ["latin"], variable: "--font-ui-face" });
// Inside the cards: rounded and playful.
const display = Fredoka({ subsets: ["latin"], variable: "--font-display-face", weight: ["500", "600", "700"] });
const body = Nunito({ subsets: ["latin"], variable: "--font-body" });
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand-face" });
// Other scripts, used only where a page has those letters. Browsers download a
// font only when it has characters on screen, so English pages don't pay for them.
const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-devanagari", preload: false });
const gurmukhi = Noto_Sans_Gurmukhi({ subsets: ["gurmukhi"], variable: "--font-gurmukhi", preload: false });
const gujarati = Noto_Sans_Gujarati({ subsets: ["gujarati"], variable: "--font-gujarati", preload: false });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], variable: "--font-bengali", preload: false });
const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic", preload: false });

const fonts = [brand, ui, display, body, hand, devanagari, gurmukhi, gujarati, bengali, arabic].map((f) => f.variable).join(" ");

// English pages are built ahead of time in both currencies; other languages are built on first visit and then kept.
export function generateStaticParams() {
  return [
    { lang: "en", cur: "gbp" },
    { lang: "en", cur: "usd" },
  ];
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://sending-vibes.vercel.app"),
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
