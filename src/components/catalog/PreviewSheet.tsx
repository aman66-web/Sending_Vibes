"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CardPlayer } from "@/components/card/CardPlayer";
import { useI18n } from "@/i18n/client";
import { buildTemplateDemo, templatesBySlug, toneInfo } from "@/lib/catalog";
import { isEasy } from "@/lib/design-tags";
import { insideLine } from "@/lib/screen-icons";
import { occasions } from "@/lib/templates";

// Screens this narrow open a design in place, over the page, instead of on a page of its own.
const PHONE = "(max-width: 767px)";
export const onPhone = () => window.matchMedia(PHONE).matches;

// The preview gets a history entry of its own, so a phone's Back button closes it rather
// than leaving the page. Counted, so React's development double start doesn't add two.
const KEY = "envelettePreview";
let showing = 0;
const watchers = new Set<() => void>();
const tell = () => watchers.forEach((changed) => changed());
let savedRestoration: ScrollRestoration | null = null;
const ours = () => Boolean(window.history.state?.[KEY]);
// Back to how the browser restores scroll, once the preview's entry is gone.
function restoreScrolling() {
  if (savedRestoration) window.history.scrollRestoration = savedRestoration;
  savedRestoration = null;
}

// Whether a preview is open, so the tiles hidden behind it can stop playing their own cards.
export function useSheetOpen() {
  return useSyncExternalStore(
    (changed) => {
      watchers.add(changed);
      return () => watchers.delete(changed);
    },
    () => showing > 0,
    () => false,
  );
}

// Plain clicks only: a second tap of a double-tap lands on whatever has just opened
// under the finger, and mustn't choose the design or close it.
const once = (act: () => void) => (e: React.MouseEvent) => {
  if (e.detail < 2) act();
};

type Props = {
  slug: string;
  onClose: () => void;
  // Names to show on it instead of the sample ones.
  names?: { to?: string; from?: string };
  // The big button goes somewhere (in the shop) or does something (in the card maker).
  useHref?: string;
  onUse?: () => void;
  // The design's own page, with everything about it.
  detailsHref?: string;
};

// A design playing in a sheet that slides up over the page, with one big button to use it.
// Escape, Back, the ✕ or a tap outside closes it, and the page is just as it was.
export function PreviewSheet({ slug, onClose, names, useHref, onUse, detailsHref }: Props) {
  const { t } = useI18n();
  const c = t.catalog;
  const router = useRouter();
  const template = templatesBySlug[slug];
  const card = useMemo(() => buildTemplateDemo(template, names), [template, names]);
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    showing++;
    tell();
    if (!ours()) window.history.pushState({ [KEY]: true }, "");
    // Leaving the entry mustn't scroll the page back to where it was when the preview opened
    // (after "Use this design" the card maker has moved on to the top of the next step).
    if (savedRestoration === null) savedRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const onPop = () => {
      if (!ours()) close.current();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    // The page behind stays put.
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const el = panel.current;
    el?.focus({ preventScroll: true });
    if (el && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const up = onPhone();
      el.animate([{ transform: up ? "translateY(100%)" : "translateY(24px)", opacity: up ? 1 : 0 }, { transform: "none", opacity: 1 }], {
        duration: up ? 320 : 220,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      });
      backdrop.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    }
    return () => {
      showing--;
      tell();
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      html.style.overflow = overflow;
      before?.focus({ preventScroll: true });
      // Closed with a button (not Back): take its entry off again, so Back still goes where it went before.
      setTimeout(() => {
        if (showing) return;
        if (ours()) {
          window.addEventListener("popstate", restoreScrolling, { once: true });
          window.history.back();
        } else restoreScrolling();
      }, 0);
    };
  }, []);

  // Tab and Shift+Tab stay inside the sheet while it's open.
  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex='-1'])")].filter(
      (x) => x.getClientRects().length > 0,
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Links out of the preview take the place of its history entry, so Back from the next
  // page comes straight back here, not to an empty step.
  const leaveTo = (href: string) => (e: React.MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (e.detail >= 2) return;
    if (ours()) router.replace(href);
    else router.push(href);
  };

  const inside = insideLine(template, t, 4);
  const easy = isEasy(template);
  const big = "btn btn-red w-full py-4 text-xl";
  const small = "flex min-h-11 items-center rounded-full px-2 text-sm font-bold text-ink/70 underline decoration-ink/25 decoration-2 underline-offset-4 hover:text-ink";

  return createPortal(
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-4">
      <div ref={backdrop} aria-hidden className="absolute inset-0 bg-ink/60" onClick={once(onClose)} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={trapFocus}
        className="relative flex h-[94dvh] w-full max-w-md flex-col rounded-t-3xl border-2 border-b-0 border-ink bg-paper text-ink shadow-[0_-12px_40px_rgba(31,27,22,0.35)] outline-none sm:h-[min(880px,94dvh)] sm:rounded-3xl sm:border-b-2"
      >
        {/* A handle, like the sheets on a phone. */}
        <span aria-hidden className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-ink/20 sm:hidden" />
        <div className="flex shrink-0 items-start gap-3 px-4 pb-3 pt-2 sm:pt-4">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} dir="auto" className="truncate font-brand text-xl font-bold leading-tight">
              {template.name}
            </h2>
            <p className="mt-0.5 truncate text-sm text-ink/60">
              {occasions[template.occasion].emoji} {t.occasions[template.occasion].label} · {toneInfo[template.tone].emoji} {t.tones[template.tone]}
            </p>
          </div>
          <button
            type="button"
            onClick={once(onClose)}
            aria-label={c.backToDesigns.replace(/^←\s*/, "")}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper text-lg font-bold"
          >
            ✕
          </button>
        </div>
        <div className="relative mx-4 min-h-0 flex-1 overflow-hidden rounded-2xl border-2 border-ink">
          <CardPlayer card={card} preview sound bare />
        </div>
        <div className="shrink-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          {inside && <p className="text-sm font-semibold text-ink/70">{inside}</p>}
          <p className="mt-0.5 text-sm text-ink/70">{easy ? `👍 ${c.easy}: ${c.easyHint}` : `⚡ ${c.notEasy}`}</p>
          <div className="mt-3">
            {onUse ? (
              <button type="button" onClick={once(onUse)} className={big}>
                {c.useThis} →
              </button>
            ) : (
              useHref && (
                <Link href={useHref} onClick={leaveTo(useHref)} className={big}>
                  {c.useThis} →
                </Link>
              )
            )}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <button type="button" onClick={once(onClose)} className={small}>
              {c.backToDesigns}
            </button>
            {detailsHref && (
              <Link href={detailsHref} onClick={leaveTo(detailsHref)} className={small}>
                {c.details}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
