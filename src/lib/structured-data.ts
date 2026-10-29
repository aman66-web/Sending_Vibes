import { CONTACT_EMAIL } from "./terms";

// The site's public address, with no slash on the end, for anything search engines read:
// structured data, the sitemap and robots.txt. Pages are reached without /en/gbp, so that
// plain form is the one every page names as its own (see proxy.ts).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://envelette.com").replace(/\/+$/, "");

export const absolute = (path: string) => (path === "/" ? SITE_URL : `${SITE_URL}${path}`);

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

// Who runs the site, and the site itself, so search results can show the name and logo.
export function siteData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "Envelette",
        legalName: "MARTZEY LTD",
        url: SITE_URL,
        logo: absolute("/logo.png"),
        email: CONTACT_EMAIL,
        contactPoint: { "@type": "ContactPoint", contactType: "customer service", email: CONTACT_EMAIL, availableLanguage: "English" },
      },
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "Envelette", url: SITE_URL, publisher: { "@id": ORGANIZATION_ID } },
    ],
  };
}

export const seller = () => ({ "@type": "Organization", "@id": ORGANIZATION_ID, name: "Envelette" });

// The trail above a page's heading. The last step is the page itself, so it needs no link.
export function breadcrumbs(steps: { name: string; path?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: steps.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.name, ...(s.path ? { item: absolute(s.path) } : {}) })),
  };
}

// Dictionary text without its **bold** and [link](/path) marks, for search engines.
export const plainText = (text: string) => text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\((\/(?!\/)[^)\s]*)\)/g, "$1");

export function faqPage(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: plainText(f.q), acceptedAnswer: { "@type": "Answer", text: plainText(f.a) } })),
  };
}
