import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

function remotePatterns() {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
  const urls = [process.env.NEXT_PUBLIC_SITE_URL, process.env.SUPABASE_URL];

  patterns.push({
    protocol: "https",
    hostname: "images.unsplash.com",
  });

  for (const value of urls) {
    if (!value) continue;
    try {
      const url = new URL(value);
      patterns.push({
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
      });
    } catch {
      // Ignore invalid local development values.
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: remotePatterns(),
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
});
