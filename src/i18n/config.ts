// The languages the site can be shown in. The cards themselves stay in English.

export const LOCALES = ["en", "hi", "pa", "gu", "bn", "ur", "ar", "pl", "es", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "lang";

export const LANGUAGES: Record<Locale, { name: string; english: string; tag: string; dir: "ltr" | "rtl" }> = {
  en: { name: "English", english: "English", tag: "en-GB", dir: "ltr" },
  hi: { name: "हिन्दी", english: "Hindi", tag: "hi-IN", dir: "ltr" },
  pa: { name: "ਪੰਜਾਬੀ", english: "Punjabi", tag: "pa-IN", dir: "ltr" },
  gu: { name: "ગુજરાતી", english: "Gujarati", tag: "gu-IN", dir: "ltr" },
  bn: { name: "বাংলা", english: "Bengali", tag: "bn-BD", dir: "ltr" },
  ur: { name: "اردو", english: "Urdu", tag: "ur-PK", dir: "rtl" },
  ar: { name: "العربية", english: "Arabic", tag: "ar", dir: "rtl" },
  pl: { name: "Polski", english: "Polish", tag: "pl-PL", dir: "ltr" },
  es: { name: "Español", english: "Spanish", tag: "es-ES", dir: "ltr" },
  fr: { name: "Français", english: "French", tag: "fr-FR", dir: "ltr" },
};

export const isLocale = (value: unknown): value is Locale => typeof value === "string" && (LOCALES as readonly string[]).includes(value);

// Fills in {placeholders}: fmt("{n} designs", { n: 5 }) → "5 designs".
export function fmt(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
}
