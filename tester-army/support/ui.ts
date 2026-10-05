import type { Browser } from "@e2e-dev/web";
import { credentials, expect, type App, type Screen } from "e2e";
import type { GeneralUser } from "../../e2e/support/test-data";

export async function loginMember(
  app: App,
  screen: Screen,
  browser: Browser,
  member: GeneralUser,
  next = "/me",
): Promise<void> {
  await app.open(`/login?next=${encodeURIComponent(next)}`);
  await screen.getByLabel("メールアドレス", { exact: false }).fill(member.email);
  await screen
    .getByLabel("パスワード", { exact: false })
    .fill(credentials.user("general").password);
  await screen.getByRole("button", "ログインする").tap();
  await expect(browser).toHaveURL(next);
}

export async function fillReportForSubmission(screen: Screen): Promise<void> {
  await screen.getByRole("button", "次へ").tap();
  await screen.getByLabel(/^結果・感想/).fill("処理区と無処理区を観察した検証用の結果です。");
  await screen.getByRole("button", "樹勢改善").tap();
  await screen.getByRole("button", "次へ").tap();
  await screen.getByLabel(/^栽培環境/).fill("露地栽培で比較しました。");
  await screen.getByRole("button", "生育初〜中期").tap();
  await screen
    .getByLabel("処理日・定植日・生育状況（必須）")
    .fill("9月1日定植、9月10日施用しました。");
  await screen.getByRole("button", "次へ").tap();
  await screen.getByRole("button", "グラフ1の調査項目を編集").tap();
  await screen.getByLabel("調査項目（必須）").fill("活着率");
  await screen.getByLabel("調査項目（必須）").press("Enter");
  await screen.getByLabel("単位（任意）").press("Enter");
  const graph = screen.getByRole("region", "グラフ 1");
  for (const name of ["処理区", "無処理区"]) {
    await graph.getByLabel("区の名前（必須）").fill(name);
    await graph.getByLabel("区の名前（必須）").press("Enter");
  }
  for (const [index, value] of ["90±2 a", "80±3 b"].entries()) {
    const field = screen.getByLabel(`グラフ1の区${index + 1}の数値`);
    await field.fill(value);
    await field.press("Enter");
    await screen
      .getByLabel(/^調査した範囲/)
      .nth(index)
      .fill("10株");
    await screen
      .getByLabel(/^この区の説明/)
      .nth(index)
      .fill(
        index === 0 ? "1000倍、200L/10aを1回葉面散布しました。" : "資材なし。他の条件は同じです。",
      );
  }
  await screen.getByLabel(/資材を使った区の説明に/).check();
  await screen.getByRole("button", "次へ").tap();
  await screen.getByLabel(/投稿ガイドラインを確認し/).check();
}
