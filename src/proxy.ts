import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/config";
import { CURRENCY_COOKIE, currencyForCountry, isCurrency } from "@/lib/pricing";

// Every page lives under app/[lang]/[cur]. Visitors never see either in the
// address: /cards is quietly served from /hi/gbp/cards for someone in the UK
// who picked Hindi. Pages stay static, one copy per language and currency.

function preferred(header: string | null): Locale | undefined {
  const ranked = (header ?? "")
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.split("-")[0].toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return ranked.map((r) => r.lang).find(isLocale);
}

// The site's old address. Pages there move to envelette.com; the API (which this
// proxy never sees) stays put, because Stripe's webhook still points at it.
const OLD_HOST = "sending-vibes.vercel.app";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (request.headers.get("host") === OLD_HOST) return NextResponse.redirect(`https://envelette.com${pathname}${search}`, 308);
  const [, first, second] = pathname.split("/");
  // Already has both (e.g. /hi/gbp/cards): serve it as it is.
  if (isLocale(first) && isCurrency(second)) return NextResponse.next();

  const savedLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const savedCurrency = request.cookies.get(CURRENCY_COOKIE)?.value;
  const locale = isLocale(first) ? first : isLocale(savedLocale) ? savedLocale : (preferred(request.headers.get("accept-language")) ?? DEFAULT_LOCALE);
  // Vercel says which country the visitor is in. The first answer is kept, so prices don't change mid-trip.
  const currency = isCurrency(savedCurrency) ? savedCurrency : currencyForCountry(request.headers.get("x-vercel-ip-country"));

  const rest = isLocale(first) ? pathname.slice(first.length + 1) : pathname;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}/${currency}${rest === "/" ? "" : rest}`;
  const response = NextResponse.rewrite(url);
  if (!isCurrency(savedCurrency)) response.cookies.set(CURRENCY_COOKIE, currency, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return response;
}

export const config = {
  // Everything except the API, Next's own files and anything with a file extension.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
