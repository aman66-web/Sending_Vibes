"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./config";
import type { Dict } from "./en";

const I18nContext = createContext<{ locale: Locale; t: Dict } | null>(null);

export function I18nProvider({ locale, t, children }: { locale: Locale; t: Dict; children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

// The page's language and text, for client components.
export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n needs an I18nProvider above it");
  return value;
}
