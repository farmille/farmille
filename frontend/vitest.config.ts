import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Phase 18 で導入。Next.js / React Server Component の Server-only コードは
// 直接インポートしてもテストし辛いため、本構成では:
//  - 純粋な component (BannerCard / HomeContent 等) を vitest + happy-dom で render
//  - Page (Server Component) は redirect ロジックを部分関数として import / test
// next 専用 API（next/navigation 等）は test 内で vi.mock() する。
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
