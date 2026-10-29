"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { price } from "@/lib/pricing";

// Browsers with the Navigation API say whether the page before this one was on our site.
type WithNavigation = { navigation?: { currentEntry?: { index: number } | null } };

// The bar under a full-screen demo: back to where they were, or straight on to making it.
// It sits below the card rather than over it (see DemoPage), and stays in view if the card
// scrolls. The chat button, when there is one, lines up at its end (see Chat.tsx).
export function DemoBar({ slug, back }: { slug: string; back: string }) {
  const { t, currency } = useI18n();
  const router = useRouter();
  const d = t.demo;

  // Tells the chat button to drop into line with the bar on phones, as StickyMakeBar does.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.bar = "1";
    return () => {
      delete root.dataset.bar;
    };
  }, []);

  // Back where they came from, scrolled to where they were, when that was one of our pages.
  // Otherwise (they arrived on this link, or the browser can't tell) the link's own page.
  const goBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const entry = (window as WithNavigation).navigation?.currentEntry;
    if (entry && entry.index > 0) {
      e.preventDefault();
      router.back();
    }
  };

  return (
    // Under the chat button (z-40) but over the card's own pieces; room is left at the end for it.
    <div className="sticky bottom-0 z-30 border-t-2 border-ink bg-cream px-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))] pt-3 sm:pb-[calc(1rem_+_env(safe-area-inset-bottom))] sm:pt-4 [html:has(.chat-launcher)_&]:pe-20">
      <div className="mx-auto flex max-w-4xl items-center gap-2 sm:gap-4">
        <Link href={back} onClick={goBack} className="btn btn-paper shrink-0 px-4 py-3 text-base">
          {d.back}
        </Link>
        <p className="hidden flex-1 text-sm text-ink/65 md:block">{d.note}</p>
        <Link href={`/create?template=${slug}`} className="btn btn-red min-w-0 flex-1 px-4 py-3 text-center text-base md:flex-none md:px-7">
          {fmt(d.make, { price: price("card", currency) })}
        </Link>
      </div>
    </div>
  );
}

// Lays out a full-screen card with the bar beneath it. The card normally fills the whole
// screen on its own (min-h-dvh), so here it fills what the bar leaves instead.
export function DemoPage({ children, slug, back }: { children: React.ReactNode; slug: string; back: string }) {
  return (
    <div className="flex min-h-dvh flex-col [&>*:first-child]:min-h-0 [&>*:first-child]:grow">
      {children}
      <DemoBar slug={slug} back={back} />
    </div>
  );
}
