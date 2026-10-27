import "server-only";
import { lang } from "next/root-params";
import { DEFAULT_LOCALE, isLocale } from "./config";
import { DICTS } from "./dictionaries";

// The language of the page being rendered, and its text. Usable in any server component.
export async function getI18n() {
  const value = await lang();
  const locale = isLocale(value) ? value : DEFAULT_LOCALE;
  return { locale, t: DICTS[locale] };
}
