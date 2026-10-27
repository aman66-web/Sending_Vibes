import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <div className="grain flex min-h-dvh flex-col bg-cream text-ink">
      <SiteHeader />
      <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="animate-wiggle text-8xl">🙈</div>
        <h1 className="mt-6 font-brand text-5xl font-bold">This page ran away</h1>
        <p className="mt-3 text-lg text-ink/65">
          Like a No button on one of our cards, it&apos;s nowhere to be found. If someone sent you a card, check the link was copied in full.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-ink">
            Go home
          </Link>
          <Link href="/cards" className="btn btn-paper">
            Browse cards
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
