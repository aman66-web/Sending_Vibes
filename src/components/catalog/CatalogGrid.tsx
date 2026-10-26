"use client";

import { useState } from "react";
import { DEVICES, OCCASIONS, type Device, type Occasion } from "@/lib/card";
import { TEMPLATES, TONES, deviceInfo, toneInfo, type Tone } from "@/lib/catalog";
import { occasions } from "@/lib/templates";
import { ProductTile } from "./ProductTile";

type Props = {
  // Homepage shows a short, occasion-filtered selection; /cards shows everything.
  limit?: number;
  allFilters?: boolean;
  initialOccasion?: Occasion;
};

export function CatalogGrid({ limit, allFilters = false, initialOccasion }: Props) {
  const [occasion, setOccasion] = useState<Occasion | "all">(initialOccasion ?? "all");
  const [tone, setTone] = useState<Tone | "all">("all");
  const [device, setDevice] = useState<Device | "all">("all");

  let results = TEMPLATES.filter(
    (t) => (occasion === "all" || t.occasion === occasion) && (tone === "all" || t.tone === tone) && (device === "all" || t.device === device),
  );
  if (limit) results = [...results].sort((a, b) => Number(!!b.featured) - Number(!!a.featured)).slice(0, limit);

  return (
    <div>
      <div className="space-y-3">
        <ChipRow label="Occasion">
          <Chip active={occasion === "all"} onClick={() => setOccasion("all")}>All</Chip>
          {OCCASIONS.map((o) => (
            <Chip key={o} active={occasion === o} onClick={() => setOccasion(o)}>
              {occasions[o].emoji} {occasions[o].label}
            </Chip>
          ))}
        </ChipRow>
        {allFilters && (
          <>
            <ChipRow label="Vibe">
              <Chip active={tone === "all"} onClick={() => setTone("all")}>All</Chip>
              {TONES.map((t) => (
                <Chip key={t} active={tone === t} onClick={() => setTone(t)}>
                  {toneInfo[t].emoji} {toneInfo[t].label}
                </Chip>
              ))}
            </ChipRow>
            <ChipRow label="Device">
              <Chip active={device === "all"} onClick={() => setDevice("all")}>All</Chip>
              {DEVICES.map((d) => (
                <Chip key={d} active={device === d} onClick={() => setDevice(d)}>
                  {deviceInfo[d].emoji} {deviceInfo[d].label}
                </Chip>
              ))}
            </ChipRow>
          </>
        )}
      </div>

      {allFilters && (
        <p className="mt-6 text-sm font-semibold text-ink/50">
          {results.length} design{results.length === 1 ? "" : "s"}
        </p>
      )}

      {results.length ? (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {results.map((t) => (
            <ProductTile key={t.slug} template={t} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl bg-white p-10 text-center ring-1 ring-ink/5">
          <p className="text-4xl">🔍</p>
          <p className="mt-2 font-display text-xl font-bold">Nothing matches all of those yet</p>
          <button
            onClick={() => {
              setOccasion("all");
              setTone("all");
              setDevice("all");
            }}
            className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden w-20 shrink-0 text-xs font-bold uppercase tracking-widest text-ink/40 sm:block">{label}</span>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${active ? "bg-ink text-white shadow" : "bg-white text-ink/70 ring-1 ring-ink/10 hover:text-ink"}`}
    >
      {children}
    </button>
  );
}
