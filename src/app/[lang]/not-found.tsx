import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="grain flex min-h-dvh flex-col bg-cream text-ink">
      <SiteHeader />
      <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div className="animate-wiggle text-8xl">🙈</div>
        <h1 className="mt-6 font-brand text-5xl font-bold">{t.notFound.title}</h1>
        <p className="mt-3 text-lg text-ink/65">{t.notFound.body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-ink">
            {t.notFound.home}
          </Link>
          <Link href="/cards" className="btn btn-paper">
            {t.notFound.browse}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
