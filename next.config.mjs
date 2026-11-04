import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Removed/merged articles. statusCode 301 (Next's `permanent` would send 308).
  async redirects() {
    return [
      // 2026-11-04: exact duplicate deleted, older copy kept
      { source: "/ar/articles/conditionsofusages", destination: "/ar/articles/heavyequipmenusages", statusCode: 301 },
      // 2026-11-04: 6-word article unpublished
      { source: "/en/articles/best-plumbing-companies", destination: "/en/services/plumbing", statusCode: 301 },
    ];
  },
  images: {
    // Django serves uploaded media at /media/ — allow it in dev and behind nginx.
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default withNextIntl(nextConfig);
