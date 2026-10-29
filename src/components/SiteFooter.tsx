import Link from "next/link";
import { Fragment } from "react";
import { Logo } from "@/components/Logo";
import { OCCASIONS } from "@/lib/card";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { occasions } from "@/lib/templates";
import { COMPANY, CONTACT_EMAIL } from "@/lib/terms";

// Text with our email address in it, the address made into a link that opens their email.
export function WithEmail({ text, linkClass }: { text: string; linkClass: string }) {
  return text.split(CONTACT_EMAIL).map((part, i) => (
    <Fragment key={i}>
      {i > 0 && (
        <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
          {CONTACT_EMAIL}
        </a>
      )}
      {part}
    </Fragment>
  ));
}

export async function SiteFooter() {
  const { t } = await getI18n();
  return (
    <footer className="bg-ink text-cream/65">
      <div aria-hidden className="airmail h-2" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_2fr_1fr]">
        <div>
          <Logo textClass="text-cream" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            {t.footer.blurb}
          </p>
          <Link href="/create" className="btn btn-red mt-5 px-5 py-2.5 text-sm">
            {t.nav.makeCard}
          </Link>
          <p className="mt-6 max-w-xs text-sm leading-relaxed">
            <WithEmail text={fmt(t.footer.ask, { email: CONTACT_EMAIL })} linkClass="font-semibold text-cream underline decoration-hot decoration-2 underline-offset-4" />
          </p>
        </div>
        <div>
          <p className="font-brand text-lg font-bold text-cream">{t.footer.occasions}</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm font-semibold sm:grid-cols-3">
            {OCCASIONS.map((o) => (
              <li key={o}>
                <Link href={`/occasions/${o}`} className="transition hover:text-cream">
                  {occasions[o].emoji} {t.occasions[o].label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-brand text-lg font-bold text-cream">{t.footer.shop}</p>
          <ul className="mt-4 space-y-2 text-sm font-semibold">
            <li>
              <Link href="/cards" className="transition hover:text-cream">{t.footer.allCards}</Link>
            </li>
            <li>
              <Link href="/#how" className="transition hover:text-cream">{t.footer.how}</Link>
            </li>
            <li>
              <Link href="/#pricing" className="transition hover:text-cream">{t.footer.pricing}</Link>
            </li>
            <li>
              <Link href="/help" className="transition hover:text-cream">{t.footer.help}</Link>
            </li>
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="transition hover:text-cream">{t.footer.contact}</a>
            </li>
            <li>
              <Link href="/privacy" className="transition hover:text-cream">{t.footer.privacy}</Link>
            </li>
            <li>
              <Link href="/terms" className="transition hover:text-cream">{t.footer.terms}</Link>
            </li>
          </ul>
        </div>
      </div>
      {/* The company details the law asks for. Extra room at the bottom on phones keeps them clear of the chat button. */}
      <div className="border-t border-cream/15">
        <div className="mx-auto max-w-6xl space-y-1.5 px-4 py-5 text-xs leading-relaxed max-sm:pb-24 sm:px-6">
          <p>{fmt(t.footer.company, { name: COMPANY.legalName, number: COMPANY.number, address: `${COMPANY.street}, ${COMPANY.town} ${COMPANY.postcode}` })}</p>
          <p>{fmt(t.footer.copyright, { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
