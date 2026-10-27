import "server-only";
import type { Locale } from "./config";
import { ar } from "./ar";
import { bn } from "./bn";
import { en, type Dict } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { gu } from "./gu";
import { hi } from "./hi";
import { pa } from "./pa";
import { pl } from "./pl";
import { ur } from "./ur";

// Translations are only ever loaded on the server; each page sends its own
// language's text to the browser.
export const DICTS: Record<Locale, Dict> = {
  en,
  hi,
  pa,
  gu,
  bn,
  ur,
  ar,
  pl,
  es,
  fr,
};
