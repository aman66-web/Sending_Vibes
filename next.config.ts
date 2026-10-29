import type { NextConfig } from "next";

// Sent cards are private. Their pages already say "noindex", but this header covers their
// link-preview images too, at both addresses a card can be reached by.
const PRIVATE = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/c/:path*", headers: PRIVATE },
      { source: "/:lang/:cur/c/:path*", headers: PRIVATE },
    ];
  },
};

export default nextConfig;
