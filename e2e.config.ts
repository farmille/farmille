import { web } from "@e2e-dev/web";
import { openai } from "@ai-sdk/openai";
import { gateway } from "ai";
import type { E2EConfig } from "e2e";
import { localChromiumCdpEndpoint } from "./e2e/support/browser-environment";

import {
  FARMILLE_E2E_ORIGIN,
  localApplicationEnvironment,
  requiredEnvironment,
} from "./tester-army/support/environment";

const applicationEnvironment = localApplicationEnvironment();
const cdpEndpoint = localChromiumCdpEndpoint();
const agentMode = process.env.FARMILLE_TESTER_ARMY_AI === "1";
if (agentMode && !process.env.OPENAI_API_KEY) requiredEnvironment("AI_GATEWAY_API_KEY");

export default {
  tests: agentMode ? "tester-army/agent/**/*.e2e.ts" : "tester-army/tests/**/*.e2e.ts",
  targets: [
    {
      name: "chromium-375",
      engine: web({
        browser: "chromium",
        viewport: { width: 375, height: 812 },
        connect: cdpEndpoint === undefined ? undefined : { cdpEndpoint: () => cdpEndpoint },
      }),
      app: {
        url: FARMILLE_E2E_ORIGIN,
        environment: "test",
        command:
          process.env.PLAYWRIGHT_EXTERNAL_WEB_SERVER === "1"
            ? undefined
            : {
                executable: process.execPath,
                args: ["scripts/start-tester-army-app.mjs"],
                env: applicationEnvironment,
                startupTimeout: 240_000,
                log: ".e2e/logs/app.log",
              },
      },
    },
  ],
  agents: agentMode
    ? {
        default: {
          model: process.env.OPENAI_API_KEY ? openai("gpt-6-luna") : gateway("openai/gpt-6-luna"),
          maxSteps: 25,
          maxModelCalls: 25,
          context:
            "Farmilleは農業資材の感想口コミ、実証詳細レポート、メーカー記事を扱います。全文レポートは会員限定です。お気に入りと投稿保存は別の操作です。",
          system:
            "ローカルの検証データだけを使い、指定した操作の結果を画面で確認してください。資材や他の会員のデータを勝手に変更しないでください。",
        },
      }
    : undefined,
  credentials: {
    general: { username: "e2e-general@example.test", password: "Farmille-E2E-General-2026!" },
    seller: { username: "e2e-seller", password: "Farmille-E2E-Seller-2026!" },
  },
  workers: 1,
  timeout: 120_000,
  assertionTimeout: 15_000,
  cleanupTimeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporters: ["list", "junit", "markdown"],
  cache: "off",
  trace: "retain-on-failure",
  video: "retain-on-failure",
} satisfies E2EConfig;
