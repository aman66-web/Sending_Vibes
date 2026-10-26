import Link from "next/link";
import { Logo } from "@/components/Logo";
import { OCCASIONS } from "@/lib/card";
import { occasions } from "@/lib/templates";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_2fr_1fr]">
        <div>
          <Logo textClass="text-white" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Personalised interactive cards with games, photos, music and a big finale. Made in two minutes, remembered for ages.
          </p>
          <Link href="/create" className="mt-5 inline-block rounded-full bg-hot px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white hover:text-ink">
            Make a card
          </Link>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Occasions</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm font-semibold sm:grid-cols-3">
            {OCCASIONS.map((o) => (
              <li key={o}>
                <Link href={`/occasions/${o}`} className="transition hover:text-white">
                  {occasions[o].emoji} {occasions[o].label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Sending Vibes</p>
          <ul className="mt-4 space-y-2 text-sm font-semibold">
            <li>
              <Link href="/cards" className="transition hover:text-white">All cards</Link>
            </li>
            <li>
              <Link href="/#how" className="transition hover:text-white">How it works</Link>
            </li>
            <li>
              <Link href="/#pricing" className="transition hover:text-white">Pricing</Link>
            </li>
            <li>
              <Link href="/help" className="transition hover:text-white">Help &amp; FAQ</Link>
            </li>
            <li>
              <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs sm:px-6">© {new Date().getFullYear()} Sending Vibes. Made with love (and a No button that never works).</p>
      </div>
    </footer>
  );
}
