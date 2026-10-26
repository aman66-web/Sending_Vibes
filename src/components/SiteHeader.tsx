import Link from "next/link";
import { Logo } from "@/components/Logo";

const LINKS = [
  { href: "/cards", label: "Cards" },
  { href: "/occasions", label: "Occasions" },
  { href: "/#how", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/help", label: "Help" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-cream/75 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />
        <div className="hidden items-center gap-7 text-sm font-semibold text-ink/70 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/create" className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-hot">
            Make a card
          </Link>
          {/* A plain <details> menu on phones, so it works without any JavaScript. */}
          <details className="group relative md:hidden">
            <summary aria-label="Menu" className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full ring-1 ring-ink/10 transition hover:bg-white [&::-webkit-details-marker]:hidden">
              <span className="relative block h-3 w-4">
                <span className="absolute inset-x-0 top-0 h-0.5 rounded bg-ink transition group-open:top-1.5 group-open:rotate-45" />
                <span className="absolute inset-x-0 top-1.5 h-0.5 rounded bg-ink transition group-open:opacity-0" />
                <span className="absolute inset-x-0 top-3 h-0.5 rounded bg-ink transition group-open:top-1.5 group-open:-rotate-45" />
              </span>
            </summary>
            <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl bg-white p-2 shadow-xl ring-1 ring-ink/10">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-xl px-4 py-3 font-semibold text-ink/80 hover:bg-cream hover:text-ink">
                  {l.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
