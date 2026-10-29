"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OCCASIONS, type Occasion } from "@/lib/card";
import { TEMPLATES, TONES, toneInfo, type Template, type Tone } from "@/lib/catalog";
import { RECIPIENTS, RECIPIENT_EMOJI, type Recipient } from "@/lib/design-tags";
import { fewOfEach, findDesigns } from "@/lib/search";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { occasions } from "@/lib/templates";
import { ProductTile } from "./ProductTile";

type Chips = { occasion: Occasion | "all"; tone: Tone | "all"; who: Recipient | "all"; easy: boolean };

export type BrowserProps = {
  // Homepage shows a short, occasion-filtered selection; /cards shows everything.
  limit?: number;
  allFilters?: boolean;
  initialOccasion?: Occasion;
  // Occasions in the order to show them, soonest first (see lib/search.ts).
  order: Occasion[];
};

// The designs with their filters. Worked out in the browser, so the page itself can be
// the same for everyone and come straight from the CDN.
export function CatalogBrowser({ limit, allFilters = false, initialOccasion, order, initial, syncUrl = false }: BrowserProps & { initial?: Partial<Chips>; syncUrl?: boolean }) {
  const { t } = useI18n();
  const c = t.catalog;
  const [chips, setChips] = useState<Chips>({ occasion: initialOccasion ?? "all", tone: "all", who: "all", easy: false, ...initial });
  const [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const { occasion, tone, who, easy } = chips;

  // Chips go in the address too (/cards?occasion=diwali&for=mum), so coming Back from a
  // design finds them as they were, and a link can open the page already filtered.
  const choose = (next: Partial<Chips>) => {
    const s = { ...chips, ...next };
    setChips(s);
    if (!syncUrl) return;
    const params = new URLSearchParams();
    if (s.occasion !== "all") params.set("occasion", s.occasion);
    if (s.who !== "all") params.set("for", s.who);
    if (s.tone !== "all") params.set("vibe", s.tone);
    if (s.easy) params.set("easy", "1");
    const q = params.toString();
    window.history.replaceState(null, "", q ? `?${q}` : window.location.pathname);
  };

  const found = findDesigns(TEMPLATES, { ...chips, query }, t, order);
  // A short selection mixes the occasions coming up, unless they've picked one.
  const results = limit ? (occasion === "all" ? fewOfEach(found.designs, limit) : found.designs.slice(0, limit)) : found.designs;
  const searching = query.trim();
  const narrowed = occasion !== "all" || tone !== "all" || who !== "all" || easy;
  // Clearing the filters keeps the search if the search alone finds something.
  const clear = () => {
    const keepSearch = Boolean(searching) && findDesigns(TEMPLATES, { query }, t, order).designs.length > 0;
    choose({ occasion: "all", tone: "all", who: "all", easy: false });
    if (!keepSearch) setQuery("");
  };

  return (
    <div>
      <div className="space-y-3">
        {allFilters && (
          // Search (or Go on a phone's keyboard) puts the keyboard away so the designs show.
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              search.current?.blur();
            }}
            className="mb-5 max-w-md"
          >
            {/* A label that stays readable, not just a pale placeholder that goes when they type. */}
            <label className="block">
              <span className="mb-1.5 block ps-1 font-brand text-base font-bold text-ink">{c.searchLabel}</span>
              <span className="relative block">
                <span aria-hidden className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-lg">
                  🔍
                </span>
                <input
                  ref={search}
                  type="search"
                  enterKeyHint="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={c.searchPlaceholder}
                  className="w-full rounded-full border-2 border-ink bg-paper py-3 pe-5 ps-12 text-base font-semibold shadow-[3px_3px_0_var(--color-ink)] outline-none placeholder:font-normal placeholder:text-ink/70 focus:shadow-[3px_3px_0_var(--color-hot)]"
                />
              </span>
            </label>
          </form>
        )}
        <ChipRow label={c.occasion}>
          <Chip active={occasion === "all"} onClick={() => choose({ occasion: "all" })}>
            {c.allOccasions}
          </Chip>
          {order.map((o) => (
            <Chip key={o} active={occasion === o} onClick={() => choose({ occasion: o })}>
              {occasions[o].emoji} {t.occasions[o].label}
            </Chip>
          ))}
        </ChipRow>
        {allFilters && (
          <>
            <ChipRow label={c.whoFor}>
              <Chip active={who === "all"} onClick={() => choose({ who: "all" })}>
                {c.anyone}
              </Chip>
              {RECIPIENTS.map((r) => (
                <Chip key={r} active={who === r} onClick={() => choose({ who: r })}>
                  {RECIPIENT_EMOJI[r]} {c.who[r]}
                </Chip>
              ))}
            </ChipRow>
            <ChipRow label={c.vibe}>
              <Chip active={tone === "all"} onClick={() => choose({ tone: "all" })}>
                {c.anyVibe}
              </Chip>
              {TONES.map((x) => (
                <Chip key={x} active={tone === x} onClick={() => choose({ tone: x })}>
                  {toneInfo[x].emoji} {t.tones[x]}
                </Chip>
              ))}
            </ChipRow>
          </>
        )}
      </div>

      {allFilters && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm font-semibold text-ink/50">
            {results.length === 1 ? c.countOne : fmt(c.count, { n: results.length })}
          </p>
          <Chip active={easy} onClick={() => choose({ easy: !easy })}>
            👍 {c.easy}
          </Chip>
        </div>
      )}

      {results.length ? (
        <>
          <Grid designs={results} />
          {searching && <Scratch className="mt-12" />}
        </>
      ) : (
        <>
          <div className="sheet mt-10 p-8 text-center sm:p-10">
            <p className="text-4xl">🔍</p>
            <p className="mt-2 font-brand text-xl font-bold">{searching ? fmt(c.nothingFor, { q: searching }) : c.nothing}</p>
            <p className="mx-auto mt-4 max-w-md font-bold">{c.scratchTitle}</p>
            <p className="mx-auto mt-1 max-w-md text-ink/70">{c.scratchBody}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/create?start=custom" className="btn btn-red px-6 py-3 text-lg">
                {c.scratch}
              </Link>
              {(narrowed || searching) && (
                <button type="button" onClick={clear} className="btn btn-paper px-5 py-3">
                  {c.clear}
                </button>
              )}
            </div>
          </div>
          {found.near.length > 0 && (
            <>
              <h2 className="mt-12 font-brand text-2xl font-bold">{c.near}</h2>
              <Grid designs={found.near} />
            </>
          )}
        </>
      )}
    </div>
  );
}

// The same, starting from the filters in the address. Reading them makes this part
// wait for the browser (see the Suspense in CatalogGrid), while the page around it stays static.
export function CatalogFromUrl(props: BrowserProps) {
  const params = useSearchParams();
  const pick = <T extends string>(list: readonly T[], value: string | null) => list.find((x) => x === value);
  const initial: Partial<Chips> = {
    occasion: pick(OCCASIONS, params.get("occasion")) ?? props.initialOccasion ?? "all",
    who: pick(RECIPIENTS, params.get("for")) ?? "all",
    tone: pick(TONES, params.get("vibe")) ?? "all",
    easy: params.get("easy") === "1",
  };
  return <CatalogBrowser {...props} initial={initial} syncUrl />;
}

function Grid({ designs }: { designs: Template[] }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-7 md:grid-cols-3 lg:grid-cols-4">
      {designs.map((tpl) => (
        <ProductTile key={tpl.slug} slug={tpl.slug} />
      ))}
    </div>
  );
}

// Never a dead end: when the designs aren't quite it, one can be made from scratch.
function Scratch({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const c = t.catalog;
  return (
    <div className={`flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center ${className}`}>
      <p className="font-brand text-lg font-bold">{c.notQuite}</p>
      <Link href="/create?start=custom" className="btn btn-ink px-5 py-3">
        {c.scratch}
      </Link>
    </div>
  );
}

// One line of chips that scrolls sideways on a phone and wraps on a computer.
function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  const row = useRef<HTMLDivElement>(null);
  // A chip chosen before the page opened (from the address) is scrolled into sight.
  useEffect(() => {
    const el = row.current;
    const chip = el?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!el || !chip || chip === el.firstElementChild) return;
    const box = el.getBoundingClientRect();
    const at = chip.getBoundingClientRect();
    el.scrollLeft += at.left - box.left - (box.width - at.width) / 2;
  }, []);
  return (
    <div role="group" aria-label={label} className="flex items-center gap-3">
      <span aria-hidden className="hidden w-24 shrink-0 font-brand text-sm font-semibold text-ink/50 sm:block">
        {label}
      </span>
      <div ref={row} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
        {children}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 shrink-0 whitespace-nowrap rounded-full border-2 px-4 py-2 text-sm font-bold transition ${active ? "border-ink bg-ink text-paper" : "border-ink/15 bg-paper text-ink/75 hover:border-ink hover:text-ink"}`}
    >
      {children}
    </button>
  );
}
