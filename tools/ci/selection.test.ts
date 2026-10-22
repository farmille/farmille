import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createBrowserCheckPlan, selectStoryFiles } from "./selection.ts";

let root: string;

function write(file: string, content: string): void {
  const destination = path.join(root, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content);
}

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "farmille-ci-selection-"));
  write(
    "tsconfig.json",
    JSON.stringify({
      compilerOptions: {
        moduleResolution: "bundler",
        module: "esnext",
        jsx: "preserve",
        paths: { "@/*": ["./src/*"] },
      },
      include: ["src/**/*"],
    }),
  );
  write("src/app/articles/Reading.tsx", "export const Reading = 'article';");
  write("src/app/articles/Reading.stories.tsx", "export { Reading } from './Reading';");
  write("src/app/reports/Report.tsx", "export { Reading } from '@/app/articles/Reading';");
  write("src/app/reports/Report.stories.tsx", "export { Reading } from './Report';");
  write("src/app/me/Profile.tsx", "export const Profile = 'profile';");
  write("src/app/me/Profile.stories.tsx", "export { Profile } from './Profile';");
});

afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

describe("ブラウザ検査の対象", () => {
  it("全件指定では資料だけの変更でも全検査を実行する", () => {
    expect(createBrowserCheckPlan(root, ["docs/ops/runbook.md"], true)).toMatchObject({
      storybook: { mode: "all" },
      e2e: true,
    });
  });

  it("差分が資料・エージェント設定だけなら画面検査を起動しない", () => {
    expect(
      createBrowserCheckPlan(
        root,
        ["docs/rebuild/catalog-SPEC.md", "AGENTS.md", ".codex/skills/example/SKILL.md"],
        false,
      ),
    ).toMatchObject({
      storybook: { mode: "none" },
      e2e: false,
    });
  });

  it("Supabase のメール雛形は資料扱いせず全検査する", () => {
    expect(
      createBrowserCheckPlan(root, ["docs/email-templates/confirm-signup.html"], false),
    ).toMatchObject({
      storybook: { mode: "all" },
      e2e: true,
    });
  });

  it("変更した部品を再export経由で使う別ルートの Story も選ぶ", () => {
    expect(createBrowserCheckPlan(root, ["src/app/articles/Reading.tsx"], false)).toEqual({
      storybook: {
        mode: "selected",
        files: ["src/app/articles/Reading.stories.tsx", "src/app/reports/Report.stories.tsx"],
      },
      e2e: true,
    });
  });

  it("Story だけの変更なら対象 Story の全幅検査を残し、E2E を省く", () => {
    expect(createBrowserCheckPlan(root, ["src/app/me/Profile.stories.tsx"], false)).toEqual({
      storybook: { mode: "selected", files: ["src/app/me/Profile.stories.tsx"] },
      e2e: false,
    });
  });

  it.each([
    "export * as Reader from '../articles/Reading';",
    "export const load = () => import(`../articles/Reading`);",
  ])("namespace再exportとテンプレートリテラルのimportも追跡する：%s", (source) => {
    write("src/app/reports/Report.tsx", source);
    expect(createBrowserCheckPlan(root, ["src/app/articles/Reading.tsx"], false).storybook).toEqual(
      {
        mode: "selected",
        files: ["src/app/articles/Reading.stories.tsx", "src/app/reports/Report.stories.tsx"],
      },
    );
  });

  it("複数変更の一部だけ利用先を特定できても残りを無検査にしない", () => {
    write("src/app/new/page.tsx", "export default function Page() { return null; }");
    expect(
      createBrowserCheckPlan(root, ["src/app/me/Profile.tsx", "src/app/new/page.tsx"], false)
        .storybook.mode,
    ).toBe("all");
  });

  it("文字列の動的importと循環importも利用先を追跡する", () => {
    write(
      "src/app/reports/Report.tsx",
      "export const load = () => import('../articles/Reading'); import './cycle';",
    );
    write("src/app/reports/cycle.ts", "import './Report';");
    expect(createBrowserCheckPlan(root, ["src/app/articles/Reading.tsx"], false).storybook).toEqual(
      {
        mode: "selected",
        files: ["src/app/articles/Reading.stories.tsx", "src/app/reports/Report.stories.tsx"],
      },
    );
  });

  it.each([
    "src/components/Button.tsx",
    "src/theme/tokens.ts",
    "public/hero.png",
    "panda.config.ts",
    "pnpm-lock.yaml",
    ".storybook/preview.ts",
    "storybook-tests/responsive.spec.ts",
    "src/app/globals.css",
    "src/app/me/layout.tsx",
    "src/app/me/template.tsx",
    "src/app/me/not-found.tsx",
    "src/app/me/__mocks__/actions.ts",
    "supabase/migrations/20260101000000_example.sql",
    "unknown.config.ts",
  ])("影響を限定できない %s は全Storyを検査する", (file) => {
    write(file, "");
    expect(createBrowserCheckPlan(root, [file], false).storybook.mode).toBe("all");
  });

  it("削除・rename前のパスがあれば全Storyを検査する", () => {
    expect(
      createBrowserCheckPlan(root, ["src/app/old/Removed.tsx", "src/app/me/Profile.tsx"], false)
        .storybook.mode,
    ).toBe("all");
  });

  it("静的に解決できないローカルimportがあれば対象を絞らない", () => {
    write("src/app/reports/Report.tsx", "import './Missing';");
    expect(createBrowserCheckPlan(root, ["src/app/me/Profile.tsx"], false).storybook.mode).toBe(
      "all",
    );
  });

  it("計算された動的importがあれば対象を絞らない", () => {
    write("src/app/reports/Report.tsx", "export const load = (name: string) => import(name);");
    expect(createBrowserCheckPlan(root, ["src/app/me/Profile.tsx"], false).storybook.mode).toBe(
      "all",
    );
  });

  it("通常のCSS importは局所変更の選別を妨げない", () => {
    write("src/app/layout.tsx", "import './globals.css';");
    write("src/app/globals.css", "body { margin: 0; }");
    write("src/app/me/photo.webp", "image");
    write(
      "src/app/me/Profile.tsx",
      "import image from './photo.webp'; export const Profile = image;",
    );
    expect(createBrowserCheckPlan(root, ["src/app/me/Profile.tsx"], false).storybook.mode).toBe(
      "selected",
    );
  });

  it("Story を持たない変更も無検査にはしない", () => {
    write("src/app/new/page.tsx", "export default function Page() { return null; }");
    expect(createBrowserCheckPlan(root, ["src/app/new/page.tsx"], false).storybook.mode).toBe(
      "all",
    );
  });

  it("E2E 自身の変更では E2E だけを、単体テストの変更では画面検査を省く", () => {
    expect(createBrowserCheckPlan(root, ["e2e/search.spec.ts"], false)).toMatchObject({
      storybook: { mode: "none" },
      e2e: true,
    });
    expect(createBrowserCheckPlan(root, ["src/lib/search.test.ts"], false)).toMatchObject({
      storybook: { mode: "none" },
      e2e: false,
    });
  });

  it("不正な tsconfig は選別を成功扱いせず失敗する", () => {
    write("tsconfig.json", "invalid");
    expect(() => createBrowserCheckPlan(root, ["src/app/me/Profile.tsx"], false)).toThrow();
  });
});

describe("Storybook index と検査計画の照合", () => {
  it("index の相対パス表記を揃えて選択ファイルを照合する", () => {
    expect(
      selectStoryFiles({ mode: "selected", files: ["src/app/me/Profile.stories.tsx"] }, [
        "./src/app/me/Profile.stories.tsx",
      ]),
    ).toEqual(new Set(["src/app/me/Profile.stories.tsx"]));
  });
  it("選択したStoryがビルドに存在しなければ失敗する", () => {
    expect(() =>
      selectStoryFiles({ mode: "selected", files: ["missing.stories.tsx"] }, [
        "existing.stories.tsx",
      ]),
    ).toThrow("index にありません");
  });
  it("空のindexと不要な検査起動は失敗する", () => {
    expect(() => selectStoryFiles({ mode: "all", reason: "main" }, [])).toThrow();
    expect(() =>
      selectStoryFiles({ mode: "none", reason: "docs" }, ["existing.stories.tsx"]),
    ).toThrow();
  });
});
