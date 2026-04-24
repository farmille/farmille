import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // demo データで使っているプレースホルダサービス。本番前に実画像に差し替えて削除する
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;
