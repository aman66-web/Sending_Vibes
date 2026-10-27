"use client";

import { createContext, useContext } from "react";
import type { Currency } from "@/lib/pricing";
import type { Locale } from "./config";
import type { Dict } from "./en";

type Value = { locale: Locale; currency: Currency; t: Dict };
const I18nContext = createContext<Value | null>(null);

export function I18nProvider({ children, ...value }: Value & { children: React.ReactNode }) {
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// The page's language, currency and text, for client components.
export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n needs an I18nProvider above it");
  return value;
}
