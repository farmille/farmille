import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  agentRules: false,
  // アプリ層セキュリティヘッダ (SEC-02)。strict CSP は Sentry/GA/inline を壊しうるため
  // v1 では nosniff / clickjacking / HSTS / referrer / permissions に限定。CSP は別途。
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/password-reset/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
      {
        source: "/company-requests/removal/confirm",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
      {
        source: "/api/company-application-evidence/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "58321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // demo データで使っているプレースホルダサービス。本番前に実画像に差し替えて削除する
      { protocol: "https", hostname: "placehold.co" },
      // seed (Ryosei populated Excel) で参照する公式メーカー CDN / コーポレートサイト
      { protocol: "https", hostname: "multisite-assets.icl-growingsolutions.com" },
      { protocol: "https", hostname: "d2bu5vyg1irlw4.cloudfront.net" },
      { protocol: "https", hostname: "www.aichi-steel.co.jp" },
      // articles の hero 画像で使う Unsplash (dev デモ用、admin UI 完成後に Supabase Storage に移行)
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    automaticVercelMonitors: false,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
