"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import type { Occasion } from "@/lib/card";
import { TEMPLATES, getTemplate, toneInfo, type Template } from "@/lib/catalog";
import { RECIPIENTS, RECIPIENT_EMOJI, isEasy, type Recipient } from "@/lib/design-tags";
import { insideLine } from "@/lib/screen-icons";
import { findDesigns, occasionOrder } from "@/lib/search";
import { occasions } from "@/lib/templates";
import { PreviewSheet, onPhone } from "./PreviewSheet";
import { ProductThumb } from "./ProductThumb";

type Props = {
  occasion: Occasion | "all";
  onOccasion: (occasion: Occasion | "all") => void;
  chosen?: string;
  onChoose: (slug: string) => void;
  // On to the questions, with the chosen design (or this one).
  onNext: (slug?: string) => void;
  onBack: () => void;
  // Make one from scratch instead.
  onScratch: () => void;
  // Their names, if they've given them, to show on the preview.
  to?: string;
  from?: string;
};

// The card maker's "Pick your design" step: what's coming up first, one sideways row of
// occasions, and a preview that opens over the page. On a phone a tap opens the preview
// (with a big "Use this design"); on a computer it chooses, and "Preview it" plays it.
export function DesignPicker({ occasion, onOccasion, chosen, onChoose, onNext, onBack, onScratch, to, from }: Props) {
  const { t } = useI18n();
  const c = t.create;
  const k = t.catalog;
  // The card maker only runs in the browser, so today's date is the browser's.
  const [order] = useState(() => occasionOrder());
  const [who, setWho] = useState<Recipient | "all">("all");
  const [previewing, setPreviewing] = useState<string | null>(null);
  const names = useMemo(() => ({ to, from }), [to, from]);
  const designs = findDesigns(TEMPLATES, { occasion, who }, t, order).designs;
  const tap = (slug: string) => {
    onChoose(slug);
    if (onPhone()) setPreviewing(slug);
  };
  const chip = (on: boolean) =>
    `min-h-11 shrink-0 whitespace-nowrap rounded-full border-2 px-4 py-2 text-sm font-semibold transition ${on ? "border-brand bg-brand text-on-brand" : "border-line bg-panel hover:border-brand"}`;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-32 pt-10">
      <button type="button" onClick={onBack} className="min-h-11 text-sm font-semibold opacity-70">
        {t.custom.back}
      </button>
      <h1 className="mt-2 font-brand text-4xl font-bold sm:text-5xl">{c.pickTitle}</h1>
      <p className="mt-2 max-w-2xl opacity-70">{c.pickIntro}</p>
      <div className="mt-6 space-y-3">
        <Row label={k.occasion}>
          {(["all", ...order] as const).map((o) => (
            <button key={o} type="button" onClick={() => onOccasion(o)} aria-pressed={occasion === o} className={chip(occasion === o)}>
              {o === "all" ? t.custom.allOccasions : `${occasions[o].emoji} ${t.occasions[o].label}`}
            </button>
          ))}
        </Row>
        <Row label={k.whoFor}>
          {(["all", ...RECIPIENTS] as const).map((r) => (
            <button key={r} type="button" onClick={() => setWho(r)} aria-pressed={who === r} className={chip(who === r)}>
              {r === "all" ? k.anyone : `${RECIPIENT_EMOJI[r]} ${k.who[r]}`}
            </button>
          ))}
        </Row>
      </div>

      {designs.length ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {designs.map((tpl) => (
            <PickTile key={tpl.slug} template={tpl} on={tpl.slug === chosen} onTap={() => tap(tpl.slug)} onPreview={() => setPreviewing(tpl.slug)} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border-2 border-line bg-panel p-8 text-center">
          <p className="font-brand text-xl font-bold">{k.nothing}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => (who !== "all" ? setWho("all") : onOccasion("all"))} className="min-h-11 rounded-full border-2 border-line px-5 font-semibold">
              {k.clear}
            </button>
            <button type="button" onClick={onScratch} className="min-h-11 rounded-full bg-brand px-5 font-semibold text-on-brand">
              {k.scratch}
            </button>
          </div>
        </div>
      )}
      {designs.length > 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center">
          <p className="font-brand text-lg font-bold">{k.notQuite}</p>
          <button type="button" onClick={onScratch} className="min-h-11 rounded-full border-2 border-foreground px-5 font-semibold">
            {k.scratch}
          </button>
        </div>
      )}

      {/* Always in reach while scrolling the designs. Kept to the left, clear of the chat button. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <button
            type="button"
            onClick={() => onNext()}
            disabled={!getTemplate(chosen)}
            className="shrink-0 rounded-full bg-brand px-6 py-3 font-brand text-lg font-semibold text-on-brand shadow-lg disabled:opacity-40"
          >
            {c.pickNext} →
          </button>
          <p className="min-w-0 truncate text-sm font-semibold opacity-70">{getTemplate(chosen)?.name ?? c.pickHint}</p>
        </div>
      </div>

      {previewing && (
        <PreviewSheet
          slug={previewing}
          names={names}
          onClose={() => setPreviewing(null)}
          onUse={() => {
            const slug = previewing;
            setPreviewing(null);
            onNext(slug);
          }}
        />
      )}
    </section>
  );
}

// A labelled line of chips: one sideways-scrolling row on a phone, wrapping on a computer.
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const row = useRef<HTMLDivElement>(null);
  // An occasion chosen before this step (from a link) is scrolled into sight.
  useEffect(() => {
    const el = row.current;
    const chip = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!el || !chip || chip === el.firstElementChild) return;
    const box = el.getBoundingClientRect();
    const at = chip.getBoundingClientRect();
    el.scrollLeft += at.left - box.left - (box.width - at.width) / 2;
  }, []);
  return (
    <div role="group" aria-label={label}>
      <p aria-hidden className="mb-1.5 text-xs font-semibold uppercase tracking-wide opacity-75">
        {label}
      </p>
      <div ref={row} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {children}
      </div>
    </div>
  );
}

function PickTile({ template, on, onTap, onPreview }: { template: Template; on: boolean; onTap: () => void; onPreview: () => void }) {
  const { t } = useI18n();
  const c = t.create;
  return (
    <div
      className={`overflow-hidden rounded-3xl border-2 bg-panel shadow-sm transition ${on ? "border-brand ring-[3px] ring-brand" : "border-line hover:-translate-y-1 hover:border-brand hover:shadow-md"}`}
    >
      <button type="button" onClick={onTap} aria-pressed={on} className="block w-full text-start">
        <ProductThumb template={template} />
        <div className="p-3">
          {on && <span className="mb-1.5 inline-flex rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-on-brand">✓ {c.chosen}</span>}
          <p dir="auto" className="font-brand font-bold leading-tight">
            {template.name}
          </p>
          <p className="mt-1 text-xs opacity-70">
            {occasions[template.occasion].emoji} {t.occasions[template.occasion].label} · {toneInfo[template.tone].emoji} {t.tones[template.tone]}
          </p>
          <p className="mt-1 text-xs font-semibold leading-snug opacity-70">{insideLine(template, t)}</p>
          {isEasy(template) && <p className="mt-1 text-xs font-bold text-brand">👍 {t.catalog.easy}</p>}
        </div>
      </button>
      <button type="button" onClick={onPreview} className="flex min-h-11 w-full items-center justify-center border-t border-line px-3 text-sm font-semibold text-brand">
        {c.previewIt}
      </button>
    </div>
  );
}
