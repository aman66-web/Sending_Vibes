"use client";

import Link from "next/link";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { templatesBySlug, toneInfo } from "@/lib/catalog";
import { price } from "@/lib/pricing";
import { occasions } from "@/lib/templates";
import { TilePreview } from "./TilePreview";

export function PlayIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" />
    </svg>
  );
}

// A card design in a product grid, drawn as a postage stamp. It plays itself as
// it scrolls past; the tile opens its product page.
// Takes a slug rather than the design itself, which holds functions that can't be sent from the server.
export function ProductTile({ slug }: { slug: string }) {
  const { t, currency } = useI18n();
  const template = templatesBySlug[slug];
  return (
    <Link href={`/cards/${template.slug}`} className="group block" aria-label={fmt(t.catalog.previewAria, { name: template.name })}>
      <div className="transition duration-300 [filter:drop-shadow(1px_3px_3px_rgba(31,27,22,0.3))] group-hover:-translate-y-1 group-hover:-rotate-1">
        <div className="stamp">
          <div className="relative overflow-hidden">
            <TilePreview slug={template.slug} />
            <div className="absolute inset-0 grid place-items-center bg-ink/0 transition duration-300 group-hover:bg-ink/30 [@media(hover:none)]:hidden">
              <span className="grid h-16 w-16 scale-75 place-items-center rounded-full border-2 border-ink bg-paper ps-1 text-ink opacity-0 transition duration-300 group-hover:scale-100 group-hover:opacity-100">
                <PlayIcon className="h-7 w-7" />
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 px-1">
        <div className="flex items-start justify-between gap-2">
          <h3 dir="auto" className="font-brand text-lg font-bold leading-tight text-ink">{template.name}</h3>
          <span className="shrink-0 pt-0.5 text-sm font-bold text-hot" dir="ltr">
            {price("card", currency)}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          {occasions[template.occasion].emoji} {t.occasions[template.occasion].label} · {toneInfo[template.tone].emoji} {t.tones[template.tone]}
        </p>
      </div>
    </Link>
  );
}
