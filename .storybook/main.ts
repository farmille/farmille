import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  features: {
    // BottomNav / FabBar 等の非同期サーバーコンポーネントをプレビューで描画する
    experimentalRSC: true,
  },
};

export default config;
