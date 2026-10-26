import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sending-vibes.vercel.app";

export default function robots(): MetadataRoute.Robots {
  // Sent cards are private, so keep them (and the API) out of search results.
  return { rules: { userAgent: "*", allow: "/", disallow: ["/c/", "/api/"] }, sitemap: `${BASE}/sitemap.xml` };
}
