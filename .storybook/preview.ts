import type { Preview } from "@storybook/nextjs-vite";
import { sb } from "storybook/test";

import "gen-interface-jp/400.css";
import "gen-interface-jp/500.css";
import "gen-interface-jp/600.css";
import "gen-interface-jp/700.css";
import "gen-interface-jp/800.css";
import "../src/app/globals.css";

// Supabase・next/headers に依存する server モジュールを __mocks__ 配下の実装へ差し替える
sb.mock(import("../src/server/auth.ts"));
sb.mock(import("../src/server/actions/helpful.ts"));
sb.mock(import("../src/server/actions/post-actions.ts"));
sb.mock(import("../src/server/queries/post-actions.ts"));
sb.mock(import("../src/server/actions/reports.ts"));
sb.mock(import("../src/env.ts"));
sb.mock(import("../src/lib/analytics/events.ts"));
sb.mock(import("../src/app/admin/materials/actions.ts"));
sb.mock(import("../src/app/admin/materials/requests/actions.ts"));
sb.mock(import("../src/app/admin/mfa/actions.ts"));
sb.mock(import("../src/app/admin/reports/actions.ts"));
sb.mock(import("../src/app/admin/sellers/[id]/actions.ts"));
sb.mock(import("../src/app/admin/tags/actions.ts"));
sb.mock(import("../src/app/admin/usage-reports/[id]/actions.ts"));
sb.mock(import("../src/app/dashboard/articles/actions.ts"));
sb.mock(import("../src/app/dashboard/materials/actions.ts"));
sb.mock(import("../src/app/dashboard/materials/[id]/actions.ts"));
sb.mock(import("../src/app/login/actions.ts"));
sb.mock(import("../src/app/materials/[id]/actions.ts"));
sb.mock(import("../src/app/materials/[id]/report/new/actions.ts"));
sb.mock(import("../src/app/materials/[id]/review/actions.ts"));
sb.mock(import("../src/app/me/edit/actions.ts"));
sb.mock(import("../src/app/me/saved/actions.ts"));
sb.mock(import("../src/app/password-reset/actions.ts"));
sb.mock(import("../src/app/account/password/actions.ts"));
sb.mock(import("../src/app/sellers/password-reset/actions.ts"));
sb.mock(import("../src/app/password-reset/update/actions.ts"));
sb.mock(import("../src/app/sellers/apply/actions.ts"));
sb.mock(import("../src/app/sellers/login/actions.ts"));
sb.mock(import("../src/app/signup/actions.ts"));

// 主要なブレークポイントの直前後をツールバーから連続して確認できるようにする。
const viewports = {
  mobile320: {
    name: "モバイル 320px",
    styles: { width: "320px", height: "700px" },
    type: "mobile" as const,
  },
  mobile375: {
    name: "モバイル 375px",
    styles: { width: "375px", height: "812px" },
    type: "mobile" as const,
  },
  mobile414: {
    name: "モバイル 414px",
    styles: { width: "414px", height: "896px" },
    type: "mobile" as const,
  },
  tablet768: {
    name: "タブレット 768px",
    styles: { width: "768px", height: "1024px" },
    type: "tablet" as const,
  },
  desktop1024: {
    name: "デスクトップ 1024px",
    styles: { width: "1024px", height: "900px" },
    type: "desktop" as const,
  },
  desktop1440: {
    name: "デスクトップ 1440px",
    styles: { width: "1440px", height: "1000px" },
    type: "desktop" as const,
  },
};

const preview: Preview = {
  parameters: {
    nextjs: { appDirectory: true },
    viewport: { options: viewports },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  initialGlobals: {
    viewport: { value: "mobile375", isRotated: false },
  },
};

export default preview;
