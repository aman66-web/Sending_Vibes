import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLive, isLocale, type Locale } from "@/i18n/config";
import { CURRENCY_COOKIE, DEFAULT_CURRENCY, isCurrency, visitorCurrency } from "@/lib/pricing";

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
  return ranked.map((r) => r.lang).find(isLive);
}

// The site's old address. Pages there move to envelette.com; the API (which this
// proxy never sees) stays put, because Stripe's webhook still points at it.
const OLD_HOST = "sending-vibes.vercel.app";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (request.headers.get("host") === OLD_HOST) return NextResponse.redirect(`https://envelette.com${pathname}${search}`, 308);
  // A badly encoded address (a stray "%") can't be read at all: show the friendly
  // not-found page, rather than the bare error Next gives when it can't decode it.
  try {
    decodeURIComponent(pathname);
  } catch {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}/${DEFAULT_CURRENCY}/missing`;
    return NextResponse.rewrite(url, { status: 404 });
  }
  const parts = pathname.split("/");
  const [, first, second] = parts;
  // A language that's switched off (an old /hi/cards link): drop it from the address.
  if (isLocale(first) && !isLive(first)) {
    const url = request.nextUrl.clone();
    url.pathname = "/" + parts.slice(isCurrency(second) ? 3 : 2).join("/");
    return NextResponse.redirect(url);
  }
  const savedCurrency = request.cookies.get(CURRENCY_COOKIE)?.value;
  // Prices are always the visitor's own country's (see visitorCurrency).
  const currency = visitorCurrency(request.headers.get("x-vercel-ip-country"), savedCurrency);
  // Already has both (e.g. /en/gbp/cards): serve it as it is, unless it's another country's
  // prices, which go to the same page in the visitor's own.
  if (isLive(first) && isCurrency(second)) {
    if (second === currency) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `/${first}/${parts.slice(3).join("/")}`;
    return NextResponse.redirect(url);
  }

  const savedLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLive(first) ? first : isLive(savedLocale) ? savedLocale : (preferred(request.headers.get("accept-language")) ?? DEFAULT_LOCALE);

  const rest = isLive(first) ? pathname.slice(first.length + 1) : pathname;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}/${currency}${rest === "/" ? "" : rest}`;
  const response = NextResponse.rewrite(url);
  if (savedCurrency !== currency) response.cookies.set(CURRENCY_COOKIE, currency, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return response;
}

export const config = {
  // Everything except the API, Next's own files and real files (images, robots.txt and so
  // on). Other addresses with a dot in, or starting "api" (/cards.html, /apis), come
  // through too, so they get the friendly not-found page instead of a bare one.
  matcher: ["/((?!api/|api$|_next/|.*\\.(?:svg|png|jpe?g|webp|gif|ico|txt|xml|json|js|css|map|woff2?|webmanifest)$).*)"],
};
