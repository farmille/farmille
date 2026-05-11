import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Phase 16 で導入した vitest セットアップ。
// - happy-dom で React Testing Library を高速に回す
// - tsconfig.json の paths "@/*" を Vite alias に手動写像する
//   (vite-tsconfig-paths plugin は新規依存追加を避けるため不採用)
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
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "src/__tests__/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
    passWithNoTests: true,
  },
});
