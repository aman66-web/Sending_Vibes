import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

// Plain reading pages: help, privacy.
export function InfoPage({ kicker, title, intro, children }: { kicker: string; title: React.ReactNode; intro?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-cream text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-14 sm:px-6">
        <p className="font-bold uppercase tracking-[0.2em] text-hot">{kicker}</p>
        <h1 className="mt-3 font-display text-5xl font-bold leading-tight">{title}</h1>
        {intro && <p className="mt-4 text-lg text-ink/65">{intro}</p>}
        <div className="mt-10 space-y-10">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-ink/75 [&_a]:font-semibold [&_a]:text-hot [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </section>
  );
}
