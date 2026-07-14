import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lint is a separate CI step (`npm run lint`); don't fail production builds on it.
  eslint: { ignoreDuringBuilds: true },

  // Security headers. CSP allows self + the sample-video bucket for <video>; inline
  // style/script are required by Next's hydration. frame-ancestors blocks embedding.
  async headers() {
    // Next.js dev Fast Refresh uses eval() → needs 'unsafe-eval' in development only.
    const isDev = process.env.NODE_ENV !== "production";
    const scriptSrc = `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`;
    const csp = [
      "default-src 'self'",
      "img-src 'self' data:",
      "media-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      scriptSrc,
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
