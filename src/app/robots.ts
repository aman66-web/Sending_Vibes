import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/structured-data";

export default function robots(): MetadataRoute.Robots {
  // Sent cards (/c/…) are private, but they're left crawlable on purpose: each one says
  // "noindex" (and next.config.ts adds an X-Robots-Tag), which a search engine only sees if
  // it's allowed to fetch the page. Blocking them here would let a card link posted
  // somewhere public be listed by its address alone.
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/"] }, sitemap: `${SITE_URL}/sitemap.xml` };
}
