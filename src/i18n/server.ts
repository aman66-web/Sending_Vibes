import "server-only";
import { cur, lang } from "next/root-params";
import { DEFAULT_CURRENCY, isCurrency } from "@/lib/pricing";
import { DEFAULT_LOCALE, isLive } from "./config";
import { DICTS } from "./dictionaries";

// The language and currency of the page being rendered, and its text. Usable in any server component.
export async function getI18n() {
  const [l, c] = await Promise.all([lang(), cur()]);
  const locale = isLive(l) ? l : DEFAULT_LOCALE;
  const currency = isCurrency(c) ? c : DEFAULT_CURRENCY;
  return { locale, currency, t: DICTS[locale] };
}
