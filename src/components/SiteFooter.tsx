import Link from "next/link";
import { Logo } from "@/components/Logo";
import { OCCASIONS } from "@/lib/card";
import { occasions } from "@/lib/templates";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-cream/65">
      <div aria-hidden className="airmail h-2" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_2fr_1fr]">
        <div>
          <Logo textClass="text-cream" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Cards you play, not just read. Pick a design, add your names and photos, and send it as a link.
          </p>
          <Link href="/create" className="btn btn-red mt-5 px-5 py-2.5 text-sm">
            Make a card
          </Link>
        </div>
        <div>
          <p className="font-brand text-lg font-bold text-cream">Occasions</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm font-semibold sm:grid-cols-3">
            {OCCASIONS.map((o) => (
              <li key={o}>
                <Link href={`/occasions/${o}`} className="transition hover:text-cream">
                  {occasions[o].emoji} {occasions[o].label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-brand text-lg font-bold text-cream">The shop</p>
          <ul className="mt-4 space-y-2 text-sm font-semibold">
            <li>
              <Link href="/cards" className="transition hover:text-cream">All cards</Link>
            </li>
            <li>
              <Link href="/#how" className="transition hover:text-cream">How it works</Link>
            </li>
            <li>
              <Link href="/#pricing" className="transition hover:text-cream">Pricing</Link>
            </li>
            <li>
              <Link href="/help" className="transition hover:text-cream">Help &amp; FAQ</Link>
            </li>
            <li>
              <Link href="/privacy" className="transition hover:text-cream">Privacy</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/15">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs sm:px-6">© {new Date().getFullYear()} Sending Vibes. The No button still doesn&apos;t work.</p>
      </div>
    </footer>
  );
}
