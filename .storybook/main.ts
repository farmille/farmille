import path from "node:path";
import { mergeConfig } from "vite";
import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  viteFinal: async (config) =>
    mergeConfig(config, {
      resolve: { alias: { "next/server": path.resolve(".storybook/next-server.ts") } },
    }),
  features: {
    // BottomNav / FabBar 等の非同期サーバーコンポーネントをプレビューで描画する
    experimentalRSC: true,
  },
};

export default config;
