import Link from "next/link";
import { LanguagePicker } from "@/components/LanguagePicker";
import { Logo } from "@/components/Logo";
import { getI18n } from "@/i18n/server";

export async function SiteHeader() {
  const { t } = await getI18n();
  const LINKS = [
    { href: "/cards", label: t.nav.cards },
    { href: "/occasions", label: t.nav.occasions },
    { href: "/#how", label: t.nav.how },
    { href: "/#pricing", label: t.nav.pricing },
    { href: "/help", label: t.nav.help },
  ];
  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-cream">
      <div aria-hidden className="airmail h-1.5" />
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Logo />
        <div className="hidden items-center gap-6 font-semibold text-ink/75 lg:flex lg:gap-7">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="decoration-hot decoration-2 underline-offset-[6px] transition hover:text-ink hover:underline">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <LanguagePicker />
          <Link href="/create" className="btn btn-red whitespace-nowrap px-3.5 py-2 text-sm max-sm:hidden sm:px-5">
            {t.nav.makeCard}
          </Link>
          {/* A plain <details> menu on phones, so it works without any JavaScript. */}
          <details className="group relative lg:hidden">
            <summary aria-label={t.nav.menu} className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border-2 border-ink bg-paper [&::-webkit-details-marker]:hidden">
              <span className="relative block h-3 w-4">
                <span className="absolute inset-x-0 top-0 h-0.5 rounded bg-ink transition group-open:top-1.5 group-open:rotate-45" />
                <span className="absolute inset-x-0 top-1.5 h-0.5 rounded bg-ink transition group-open:opacity-0" />
                <span className="absolute inset-x-0 top-3 h-0.5 rounded bg-ink transition group-open:top-1.5 group-open:-rotate-45" />
              </span>
            </summary>
            <div className="sheet absolute end-0 top-12 w-56 p-2">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-xl px-4 py-3 font-semibold text-ink/80 hover:bg-cream hover:text-ink">
                  {l.label}
                </Link>
              ))}
              <Link href="/create" className="btn btn-red mt-2 w-full py-2.5 text-sm sm:hidden">
                {t.nav.makeCard}
              </Link>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
