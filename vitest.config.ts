import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// 統合 branch: Phase 16/17/18/19 の vitest 設定をまとめたもの。
// - happy-dom で React Testing Library を回す
// - "@/..." alias は tsconfig.json の paths を手動写像 (新規 plugin 不要)
// - テストは src 配下のあらゆる *.test/*.spec.{ts,tsx} と __tests__ 配下を拾う
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
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "tools/catalog/**/*.test.ts",
      "tools/ci/**/*.test.ts",
      "src/**/__tests__/**/*.{ts,tsx}",
      "src/__tests__/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["node_modules", ".next"],
    css: false,
    passWithNoTests: true,
  },
});
