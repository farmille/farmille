/**
 * Phase 16: <FavoriteButton> 表示分岐テスト
 * spec: docs/specs/my-materials.md §6.2 / §9.2
 *
 * カバー範囲:
 *  - 未ログイン: 「ログインして保存する」リンク
 *  - maker / unassigned: reviewer 専用機能の案内テキスト
 *  - reviewer 未追加: 「お気に入りに追加」「候補に追加」の 2 ボタン
 *  - reviewer 追加済: 現状ラベル + 切替 + 外す
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FavoriteButton } from "@/app/products/[id]/_components/favorite-button";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const PRODUCT_ID = "33333333-3333-3333-3333-333333333333";

describe("FavoriteButton", () => {
  beforeEach(() => {
    // 各 case が fetch を触らないようにする (未ログインは fetch しない、
    // ボタン押下系は別 e2e で確認するためここではレンダーだけ検証)
    global.fetch = vi.fn();
  });

  it("未ログイン時はログイン CTA を表示し、追加ボタンを出さない", () => {
    render(<FavoriteButton productId={PRODUCT_ID} mode={{ kind: "anon" }} />);
    expect(screen.getByText("ログインして保存する")).toBeInTheDocument();
    expect(screen.queryByText("お気に入りに追加")).not.toBeInTheDocument();
    expect(screen.queryByText("候補に追加")).not.toBeInTheDocument();
  });

  it("maker は『農家・JA・研究者向け』の案内のみで、追加 / 外す ボタンを出さない", () => {
    render(
      <FavoriteButton
        productId={PRODUCT_ID}
        mode={{ kind: "non-reviewer", role: "maker" }}
      />,
    );
    expect(
      screen.getByText(/農家・JA・研究者向け/),
    ).toBeInTheDocument();
    expect(screen.queryByText("お気に入りに追加")).not.toBeInTheDocument();
    expect(screen.queryByText("外す")).not.toBeInTheDocument();
  });

  it("reviewer 未追加は『お気に入りに追加』『候補に追加』の 2 ボタンを表示する", () => {
    render(
      <FavoriteButton
        productId={PRODUCT_ID}
        mode={{ kind: "reviewer", existing: null }}
      />,
    );
    expect(screen.getByText("お気に入りに追加")).toBeInTheDocument();
    expect(screen.getByText("候補に追加")).toBeInTheDocument();
    expect(screen.queryByText("外す")).not.toBeInTheDocument();
  });

  it("reviewer かつ favorite 追加済は『お気に入りに追加済み』+ 候補へ切替 + 外す を出す", () => {
    render(
      <FavoriteButton
        productId={PRODUCT_ID}
        mode={{
          kind: "reviewer",
          existing: { id: "abc", kind: "favorite" },
        }}
      />,
    );
    expect(screen.getByText("お気に入りに追加済み")).toBeInTheDocument();
    expect(screen.getByText("候補に移動")).toBeInTheDocument();
    expect(screen.getByText("外す")).toBeInTheDocument();
    expect(screen.queryByText("お気に入りに追加")).not.toBeInTheDocument();
  });

  it("reviewer かつ candidate 追加済は『候補に追加済み』+ お気に入りへ切替 を出す", () => {
    render(
      <FavoriteButton
        productId={PRODUCT_ID}
        mode={{
          kind: "reviewer",
          existing: { id: "abc", kind: "candidate" },
        }}
      />,
    );
    expect(screen.getByText("候補に追加済み")).toBeInTheDocument();
    expect(screen.getByText("お気に入りに移動")).toBeInTheDocument();
    expect(screen.getByText("外す")).toBeInTheDocument();
  });
});
