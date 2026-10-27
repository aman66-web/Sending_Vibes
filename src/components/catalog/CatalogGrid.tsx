"use client";

import { useState } from "react";
import { DEVICES, OCCASIONS, type Device, type Occasion } from "@/lib/card";
import { TEMPLATES, TONES, deviceInfo, toneInfo, type Tone } from "@/lib/catalog";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import type { Dict } from "@/i18n/en";
import { occasions } from "@/lib/templates";
import { ProductTile } from "./ProductTile";

type Props = {
  // Homepage shows a short, occasion-filtered selection; /cards shows everything.
  limit?: number;
  allFilters?: boolean;
  initialOccasion?: Occasion;
};

export function CatalogGrid({ limit, allFilters = false, initialOccasion }: Props) {
  const { t } = useI18n();
  const c = t.catalog;
  const [occasion, setOccasion] = useState<Occasion | "all">(initialOccasion ?? "all");
  const [tone, setTone] = useState<Tone | "all">("all");
  const [device, setDevice] = useState<Device | "all">("all");
  const [query, setQuery] = useState("");
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);

  let results = TEMPLATES.filter(
    (tpl) =>
      (occasion === "all" || tpl.occasion === occasion) &&
      (tone === "all" || tpl.tone === tone) &&
      (device === "all" || tpl.device === device) &&
      words.every((w) => searchText(tpl, t).includes(w)),
  );
  if (limit) results = [...results].sort((a, b) => Number(!!b.featured) - Number(!!a.featured)).slice(0, limit);

  return (
    <div>
      <div className="space-y-3">
        {allFilters && (
          <label className="relative mb-5 block max-w-md">
            <span className="sr-only">{c.searchLabel}</span>
            <span aria-hidden className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-lg opacity-50">
              🔍
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={c.searchPlaceholder}
              className="w-full rounded-full border-2 border-ink bg-paper py-3 pe-5 ps-12 font-semibold shadow-[3px_3px_0_var(--color-ink)] outline-none placeholder:text-ink/40 focus:shadow-[3px_3px_0_var(--color-hot)]"
            />
          </label>
        )}
        <ChipRow label={c.occasion}>
          <Chip active={occasion === "all"} onClick={() => setOccasion("all")}>{c.all}</Chip>
          {OCCASIONS.map((o) => (
            <Chip key={o} active={occasion === o} onClick={() => setOccasion(o)}>
              {occasions[o].emoji} {t.occasions[o].label}
            </Chip>
          ))}
        </ChipRow>
        {allFilters && (
          <>
            <ChipRow label={c.vibe}>
              <Chip active={tone === "all"} onClick={() => setTone("all")}>{c.all}</Chip>
              {TONES.map((x) => (
                <Chip key={x} active={tone === x} onClick={() => setTone(x)}>
                  {toneInfo[x].emoji} {t.tones[x]}
                </Chip>
              ))}
            </ChipRow>
            <ChipRow label={c.device}>
              <Chip active={device === "all"} onClick={() => setDevice("all")}>{c.all}</Chip>
              {DEVICES.map((d) => (
                <Chip key={d} active={device === d} onClick={() => setDevice(d)}>
                  {deviceInfo[d].emoji} {t.devices[d].label}
                </Chip>
              ))}
            </ChipRow>
          </>
        )}
      </div>

      {allFilters && (
        <p className="mt-6 text-sm font-semibold text-ink/50">
          {results.length === 1 ? c.countOne : fmt(c.count, { n: results.length })}
        </p>
      )}

      {results.length ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-7 md:grid-cols-3 lg:grid-cols-4">
          {results.map((tpl) => (
            <ProductTile key={tpl.slug} slug={tpl.slug} />
          ))}
        </div>
      ) : (
        <div className="sheet mt-10 p-10 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-2 font-brand text-xl font-bold">{c.nothing}</p>
          <button
            onClick={() => {
              setOccasion("all");
              setTone("all");
              setDevice("all");
              setQuery("");
            }}
            className="btn btn-ink mt-4 px-5 py-2 text-sm"
          >
            {c.clear}
          </button>
        </div>
      )}
    </div>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden w-20 shrink-0 font-brand text-sm font-semibold text-ink/50 sm:block">{label}</span>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full border-2 px-3.5 py-1.5 text-sm font-bold transition ${active ? "border-ink bg-ink text-paper" : "border-ink/15 bg-paper text-ink/75 hover:border-ink hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

// Everything a search can match: names, descriptions, occasion (in English and
// the page's language) and the kinds of screens inside.
const searchCache = new Map<string, string>();
function searchText(tpl: (typeof TEMPLATES)[number], t: Dict) {
  let text = searchCache.get(tpl.slug);
  if (!text) {
    const screens = tpl.screens("", "").map((s) => (s.type === "game" ? `${s.type} ${s.game} ${t.labels.games[s.game]}` : `${s.type} ${t.labels.screens[s.type]}`));
    text = [tpl.name, tpl.headline, tpl.blurb, occasions[tpl.occasion].label, t.occasions[tpl.occasion].label, tpl.occasion, toneInfo[tpl.tone].label, t.tones[tpl.tone], tpl.device, ...screens]
      .join(" ")
      .toLowerCase();
    searchCache.set(tpl.slug, text);
  }
  return text;
}
