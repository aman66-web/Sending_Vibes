"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// One big button kept at the bottom of a phone screen, so there's always a next step
// under their thumb. It slides up once the page's own main button (`watchId`) has
// scrolled away, and steps aside over the footer, anything marked data-no-bar (a
// section with its own big button), and while they're typing (so it never sits over
// a box or the keyboard). It leaves room at the end for the chat button, which lines
// up beside it (see Chat.tsx), and sits above the iPhone's home bar.
export function StickyMakeBar({ href, label, watchId }: { href: string; label: string; watchId: string }) {
  const [past, setPast] = useState(false);
  const [covered, setCovered] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const target = document.getElementById(watchId);
    // The header is sticky, so a button tucked under it counts as gone. The area watched
    // reaches far below the screen, so the button only counts as gone once it's above it:
    // a jump straight past it (Back putting the page where it was) still counts.
    const top = new IntersectionObserver(([entry]) => setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0), {
      rootMargin: "-80px 0px 100000px 0px",
    });
    if (target) top.observe(target);
    const inView = new Set<Element>();
    const others = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) inView.add(e.target);
        else inView.delete(e.target);
      }
      setCovered(inView.size > 0);
    });
    document.querySelectorAll("footer, [data-no-bar]").forEach((el) => others.observe(el));
    const field = (el: EventTarget | null) => el instanceof HTMLElement && el.matches("input, textarea, select, [contenteditable]");
    const onFocus = (e: FocusEvent) => setTyping(field(e.target));
    const onBlur = () => setTyping(false);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => {
      top.disconnect();
      others.disconnect();
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
    };
  }, [watchId]);

  const shown = past && !covered && !typing;

  // Tells the chat button to sit beside the bar instead of behind it.
  useEffect(() => {
    if (!shown) return;
    const root = document.documentElement;
    root.dataset.bar = "1";
    return () => {
      delete root.dataset.bar;
    };
  }, [shown]);

  return (
    <div
      inert={!shown}
      className={`fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-cream/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-[transform,visibility] duration-300 sm:hidden ${shown ? "visible translate-y-0" : "invisible translate-y-full"}`}
    >
      <Link href={href} className="btn btn-red min-h-14 w-full px-4 text-lg [html:has(.chat-launcher)_&]:w-[calc(100%_-_4.25rem)]">
        {label}
      </Link>
    </div>
  );
}
