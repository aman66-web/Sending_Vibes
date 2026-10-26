import type { MetadataRoute } from "next";
import { TEMPLATES } from "@/lib/catalog";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sending-vibes.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, priority: 1 },
    { url: `${BASE}/cards`, priority: 0.9 },
    { url: `${BASE}/create`, priority: 0.8 },
    ...TEMPLATES.map((t) => ({ url: `${BASE}/cards/${t.slug}`, priority: 0.7 })),
  ];
}
