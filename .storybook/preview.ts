import type { Preview } from "@storybook/nextjs-vite";
import { sb } from "storybook/test";
import { createElement, Fragment } from "react";
import { Toaster } from "../src/components/Toaster";

import "gen-interface-jp/400.css";
import "gen-interface-jp/500.css";
import "gen-interface-jp/600.css";
import "gen-interface-jp/700.css";
import "gen-interface-jp/800.css";
import "../src/app/globals.css";

// Supabase・next/headers に依存する server モジュールを __mocks__ 配下の実装へ差し替える
sb.mock(import("../src/server/auth.ts"));
sb.mock(import("../src/server/supabase.ts"));
sb.mock(import("../src/app/company-requests/actions.ts"));
sb.mock(import("../src/server/actions/helpful.ts"));
sb.mock(import("../src/server/actions/onboarding.ts"));
sb.mock(import("../src/server/actions/post-actions.ts"));
sb.mock(import("../src/server/queries/post-actions.ts"));
sb.mock(import("../src/server/queries/reviews.ts"));
sb.mock(import("../src/server/queries/usage-reports.ts"));
sb.mock(import("../src/server/actions/reports.ts"));
sb.mock(import("../src/env.ts"));
sb.mock(import("../src/lib/analytics/events.ts"));
sb.mock(import("../src/lib/recaptcha-client.ts"));
sb.mock(import("../src/app/admin/materials/actions.ts"));
sb.mock(import("../src/app/admin/materials/requests/actions.ts"));
sb.mock(import("../src/app/admin/mfa/actions.ts"));
sb.mock(import("../src/app/admin/reports/actions.ts"));
sb.mock(import("../src/app/admin/published-posts/actions.ts"));
sb.mock(import("../src/app/admin/sellers/[id]/actions.ts"));
sb.mock(import("../src/app/admin/tags/actions.ts"));
sb.mock(import("../src/app/admin/usage-reports/[id]/actions.ts"));
sb.mock(import("../src/app/dashboard/articles/actions.ts"));
sb.mock(import("../src/app/dashboard/materials/actions.ts"));
sb.mock(import("../src/app/login/actions.ts"));
sb.mock(import("../src/app/materials/[id]/actions.ts"));
sb.mock(import("../src/app/materials/[id]/report/new/actions.ts"));
sb.mock(import("../src/app/materials/[id]/review/actions.ts"));
sb.mock(import("../src/app/me/edit/actions.ts"));
sb.mock(import("../src/app/me/saved/actions.ts"));
sb.mock(import("../src/app/password-reset/actions.ts"));
sb.mock(import("../src/app/account/contact/actions.ts"));
sb.mock(import("../src/app/account/password/actions.ts"));
sb.mock(import("../src/app/sellers/password-reset/actions.ts"));
sb.mock(import("../src/app/password-reset/update/actions.ts"));
sb.mock(import("../src/app/sellers/apply/actions.ts"));
sb.mock(import("../src/app/sellers/login/actions.ts"));
sb.mock(import("../src/app/signup/actions.ts"));
sb.mock(import("../src/app/signup/postal-action.ts"));
sb.mock(import("../src/app/dashboard/profile/actions.ts"));

sb.mock(import("../src/server/queries/home-materials.ts"));

sb.mock(import("../src/server/accounts/passkeys.ts"));

sb.mock(import("../src/server/admin/summary.ts"));

sb.mock(import("../src/server/company-applications.ts"));

sb.mock(import("../src/server/admin/materials.ts"));

sb.mock(import("../src/server/admin/sellers.ts"));

sb.mock(import("../src/server/queries/classifications.ts"));

sb.mock(import("../src/server/material-page-audits.ts"));

sb.mock(import("../src/server/admin/material-page-review.ts"));

sb.mock(import("../src/server/material-page-editor.ts"));

sb.mock(import("../src/server/manufacturer-profile.ts"));

sb.mock(import("../src/server/admin/material-change-requests.ts"));

sb.mock(import("../src/server/admin/mfa.ts"));

sb.mock(import("../src/server/admin/published-posts.ts"));

sb.mock(import("../src/server/admin/reports.ts"));

sb.mock(import("../src/server/admin/tags.ts"));

sb.mock(import("../src/server/admin/usage-reports.ts"));

sb.mock(import("../src/server/queries/content-feed.ts"));

sb.mock(import("../src/server/queries/helpful.ts"));

sb.mock(import("../src/server/queries/articles.ts"));

sb.mock(import("../src/server/queries/view-events.ts"));

sb.mock(import("../src/server/queries/seller-dashboard.ts"));

sb.mock(import("../src/server/company-application-evidence.ts"));

sb.mock(import("../src/server/queries/seller-articles.ts"));

sb.mock(import("../src/server/queries/material-content.ts"));

sb.mock(import("../src/server/queries/materials.ts"));

sb.mock(import("../src/server/queries/saved-materials.ts"));

sb.mock(import("../src/server/accounts/registered-address.ts"));

sb.mock(import("../src/server/queries/me-page.ts"));

sb.mock(import("../src/server/queries/profile-details.ts"));

sb.mock(import("../src/server/queries/profiles.ts"));

sb.mock(import("../src/server/queries/catalog-search.ts"));

sb.mock(import("../src/server/queries/public-sellers.ts"));

sb.mock(import("../src/server/queries/public-profiles.ts"));

sb.mock(import("../src/server/company-application-auth.ts"));

sb.mock(import("../src/server/admin/guard.ts"));

sb.mock(import("../src/server/usage-reports/structured.ts"));

sb.mock(import("../src/server/pdf-reading/index.ts"));

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

// ルート画面（page / error / not-found / loading）の Story だけに通知の置き場を足す。
// Story の title は部品の置き場でも Pages 配下に入るため、title では見分けない。
const ROUTE_STORY_FILE = /\/(Page|Error|NotFound|Loading)\.stories\.tsx$/;

const preview: Preview = {
  tags: ["autodocs"],
  decorators: [
    (Story, context) =>
      ROUTE_STORY_FILE.test(context.parameters.fileName)
        ? createElement(Fragment, null, createElement(Story), createElement(Toaster))
        : createElement(Story),
  ],
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

sb.mock(import("../src/server/accounts/general.ts"));
