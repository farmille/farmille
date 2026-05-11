import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Phase 19: vitest scaffolding for component-level tests.
// - happy-dom (lighter than jsdom) for React Testing Library
// - "@/..." alias mirrors tsconfig paths so component imports resolve
// - test files live next to the component (`*.test.tsx`) or under
//   `src/**/__tests__/`
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
      "src/**/__tests__/**/*.{ts,tsx}",
    ],
    css: false,
  },
});
