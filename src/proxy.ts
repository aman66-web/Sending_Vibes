import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/config";

// Every page lives under app/[lang]. Visitors never see the language in the
// address: /cards is quietly served from /hi/cards when they've picked Hindi.
// Pages stay static, one copy per language.

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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Already has a language (e.g. /hi/cards): serve it as it is.
  if (isLocale(pathname.split("/")[1])) return NextResponse.next();

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : (preferred(request.headers.get("accept-language")) ?? DEFAULT_LOCALE);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Everything except the API, Next's own files and anything with a file extension.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
