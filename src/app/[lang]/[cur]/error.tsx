"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/i18n/client";
import { reportCaught, tryAgain } from "@/lib/report-error";

// Shown instead of a page that broke (the database slow for a moment, say), in place of
// the browser's bare error. The site's layout is still above it, so the text is too.
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const { t } = useI18n();
  const e = t.notFound.errors;
  useEffect(() => reportCaught(error), [error]);

  return (
    <div className="grain flex min-h-dvh flex-col bg-cream text-ink">
      <header className="border-b-2 border-ink bg-cream">
        <div aria-hidden className="airmail h-1.5" />
        <div className="mx-auto flex max-w-6xl items-center px-4 py-3 sm:px-6">
          <Logo />
        </div>
      </header>
      <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <div aria-hidden className="text-8xl">
          📮
        </div>
        <h1 className="mt-6 font-brand text-4xl font-bold sm:text-5xl">{e.title}</h1>
        <p className="mt-3 text-lg text-ink/65">{e.body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => tryAgain(error, retry)} className="btn btn-ink text-lg">
            {e.retry}
          </button>
          <Link href="/" className="btn btn-paper text-lg">
            {t.notFound.home}
          </Link>
        </div>
      </main>
    </div>
  );
}
