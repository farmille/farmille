import path from "node:path";
import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";

// Next.js は画像の静的 import を幅・高さ・ぼかし用データつきの StaticImageData にする。
// vite の既定は URL 文字列なので、next/image の placeholder="blur" が描画時に例外を出す。テストでも同じ形で読む。
const staticImageImport: Plugin = {
  name: "static-image-import",
  enforce: "pre",
  load(id) {
    if (!/\.(png|jpe?g|webp|avif)$/.test(id)) return null;
    const image = {
      src: id,
      width: 1200,
      height: 900,
      blurDataURL: "data:image/webp;base64,UklGRg==",
    };
    return `export default ${JSON.stringify(image)};`;
  },
};

// 統合 branch: Phase 16/17/18/19 の vitest 設定をまとめたもの。
// - happy-dom で React Testing Library を回す
// - "@/..." alias は tsconfig.json の paths を手動写像 (新規 plugin 不要)
// - テストは src 配下のあらゆる *.test/*.spec.{ts,tsx} と __tests__ 配下を拾う
export default defineConfig({
  plugins: [react(), staticImageImport],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "tools/catalog/**/*.test.ts",
      "src/**/__tests__/**/*.{ts,tsx}",
      "src/__tests__/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["node_modules", ".next"],
    css: false,
    passWithNoTests: true,
  },
});
