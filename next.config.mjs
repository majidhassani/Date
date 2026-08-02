/** @type {import('next').NextConfig} */

// Content Security Policy. `unsafe-inline` for styles is required by Next.js
// runtime style injection; scripts use nonce/hashes via Next's built-in handling.
const isDev = process.env.NODE_ENV !== "production";

const cspDirectives = [
  "default-src 'self'",
  // Next.js injects inline bootstrap scripts; in production these are hashed by Next.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // Telegram Bot API + SMTP happen server-side; browser only talks to same origin.
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "manifest-src 'self'",
  // NOTE: no `upgrade-insecure-requests` — it would force asset requests to
  // HTTPS, which breaks a plain-HTTP (no-TLS) deployment. Add it back once the
  // app is served over HTTPS behind a reverse proxy.
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // The entire app is private — never allow indexing.
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Server Actions body size guard for public submission endpoint.
    serverActions: {
      bodySizeLimit: "1mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
