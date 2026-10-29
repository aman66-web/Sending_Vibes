import { Suspense } from "react";
import type { Occasion } from "@/lib/card";
import { occasionOrder } from "@/lib/search";
import { CatalogBrowser, CatalogFromUrl, type BrowserProps } from "./CatalogBrowser";

type Props = Omit<BrowserProps, "order"> & {
  // Defaults to what's coming up today.
  order?: Occasion[];
  // Start from the filters in the address (/cards?occasion=diwali).
  fromUrl?: boolean;
};

// The card designs with their filters, what's coming up first. The order is worked out
// here, where the page is made, and handed to the browser, so both draw the same order
// even when a cached page is opened the day after.
export function CatalogGrid({ order = occasionOrder(), fromUrl = false, ...props }: Props) {
  if (!fromUrl) return <CatalogBrowser {...props} order={order} />;
  // Until the browser has read the address, everything shows (and search engines see it all).
  return (
    <Suspense fallback={<CatalogBrowser {...props} order={order} />}>
      <CatalogFromUrl {...props} order={order} />
    </Suspense>
  );
}
