import type { MetadataRoute } from "next";
import { OCCASIONS } from "@/lib/card";
import { TEMPLATES } from "@/lib/catalog";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://envelette.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, priority: 1 },
    { url: `${BASE}/cards`, priority: 0.9 },
    { url: `${BASE}/occasions`, priority: 0.9 },
    ...OCCASIONS.map((o) => ({ url: `${BASE}/occasions/${o}`, priority: 0.8 })),
    { url: `${BASE}/create`, priority: 0.8 },
    { url: `${BASE}/help`, priority: 0.5 },
    { url: `${BASE}/privacy`, priority: 0.3 },
    ...TEMPLATES.map((t) => ({ url: `${BASE}/cards/${t.slug}`, priority: 0.7 })),
  ];
}
