import type { MetadataRoute } from "next";
import { OCCASIONS } from "@/lib/card";
import { TEMPLATES } from "@/lib/catalog";
import { absolute } from "@/lib/structured-data";

// Every page that should be found in search, at the address it names as its own (no
// /en/gbp). The full-screen demos, basket, account and sent cards are left out on purpose:
// they ask not to be indexed. Share images are listed so the designs can turn up in image search.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absolute("/"), priority: 1, images: [absolute("/opengraph-image")] },
    { url: absolute("/cards"), priority: 0.9 },
    { url: absolute("/occasions"), priority: 0.9 },
    ...OCCASIONS.map((o) => ({ url: absolute(`/occasions/${o}`), priority: 0.8, images: [absolute(`/occasions/${o}/opengraph-image`)] })),
    { url: absolute("/create"), priority: 0.8 },
    { url: absolute("/help"), priority: 0.5 },
    { url: absolute("/privacy"), priority: 0.3 },
    { url: absolute("/terms"), priority: 0.3 },
    ...TEMPLATES.map((t) => ({ url: absolute(`/cards/${t.slug}`), priority: 0.7, images: [absolute(`/cards/${t.slug}/opengraph-image`)] })),
  ];
}
