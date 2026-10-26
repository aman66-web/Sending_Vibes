import Link from "next/link";
import { Logo } from "@/components/Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-cream/75 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />
        <div className="hidden items-center gap-8 text-sm font-semibold text-ink/70 md:flex">
          <Link href="/cards" className="hover:text-ink">Cards</Link>
          <Link href="/#features" className="hover:text-ink">Features</Link>
          <Link href="/#how" className="hover:text-ink">How it works</Link>
          <Link href="/#pricing" className="hover:text-ink">Pricing</Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/cards" className="rounded-full px-4 py-2.5 text-sm font-bold text-ink ring-1 ring-ink/10 transition hover:bg-white md:hidden">
            Cards
          </Link>
          <Link href="/create" className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-hot">
            Make a card
          </Link>
        </div>
      </nav>
    </header>
  );
}
