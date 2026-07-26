import { defineConfig } from "@pandacss/dev";

export default defineConfig({
  preflight: true,
  include: ["./src/**/*.{js,jsx,ts,tsx}"],
  exclude: [],
  theme: {
    tokens: {
      colors: {
        green: {
          50: { value: "#E8F5E9" },
          500: { value: "#4CAF50" },
          700: { value: "#2E7D32" },
          900: { value: "#1B5E20" },
        },
      },
      radii: {
        card: { value: "14px" },
      },
    },
  },
  outdir: "styled-system",
});
