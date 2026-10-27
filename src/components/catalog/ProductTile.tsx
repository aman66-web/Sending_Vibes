import Link from "next/link";
import { toneInfo, type Template } from "@/lib/catalog";
import { PRICES } from "@/lib/pricing";
import { occasions } from "@/lib/templates";
import { TilePreview } from "./TilePreview";

export function PlayIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" fill="currentColor" />
    </svg>
  );
}

// A card design in a product grid. Hovering shows a play button; the tile opens its product page.
export function ProductTile({ template }: { template: Template }) {
  return (
    <Link href={`/cards/${template.slug}`} className="group block" aria-label={`Preview ${template.name}`}>
      <div className="relative overflow-hidden rounded-[1.75rem] shadow-sm ring-1 ring-ink/5 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        <TilePreview slug={template.slug} />
        <div className="absolute inset-0 grid place-items-center bg-ink/0 transition duration-300 group-hover:bg-ink/35 [@media(hover:none)]:hidden">
          <span className="grid h-16 w-16 scale-75 place-items-center rounded-full bg-white pl-1 text-ink opacity-0 shadow-2xl transition duration-300 group-hover:scale-100 group-hover:opacity-100">
            <PlayIcon className="h-7 w-7" />
          </span>
        </div>
        <span className="absolute bottom-3 right-3 hidden items-center gap-1 rounded-full bg-white/90 py-1 pl-2 pr-3 text-xs font-bold text-ink shadow [@media(hover:none)]:flex">
          <PlayIcon className="h-3.5 w-3.5" /> Preview
        </span>
      </div>
      <div className="mt-3 px-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold leading-tight text-ink">{template.name}</h3>
          <span className="shrink-0 pt-0.5 text-sm font-bold text-hot">{PRICES.card.label}</span>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          {occasions[template.occasion].emoji} {occasions[template.occasion].label} · {toneInfo[template.tone].emoji} {toneInfo[template.tone].label}
        </p>
      </div>
    </Link>
  );
}
