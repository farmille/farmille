import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { MaterialLinks } from "./MaterialLinks";

describe("資料と試験結果", () => {
  it("試験の概要と出典をリンクと一緒に表示し、任意項目の欠損を補わない", () => {
    render(
      createElement(MaterialLinks, {
        links: [
          {
            group: "public_trial",
            title: "トマト試験",
            url: "https://example.com/trial.pdf",
            trial: {
              crops: "トマト",
              summary: "処理区の生育を比較",
              institution: "試験場",
              year: null,
              pageCount: null,
            },
          },
        ],
      }),
    );
    expect(screen.getByRole("link", { name: "トマト試験" })).toHaveAttribute(
      "href",
      "https://example.com/trial.pdf",
    );
    expect(screen.getByText("処理区の生育を比較")).toBeInTheDocument();
    expect(screen.getByText("試験場")).toBeInTheDocument();
    expect(screen.queryByText(/ページ/)).not.toBeInTheDocument();
  });
  it("編集中の同一URLを持つ別行を消さない", () => {
    render(
      createElement(MaterialLinks, {
        links: [
          { group: null, title: "分類前の資料", url: "https://example.com/a", trial: null },
          { group: "overview", title: "確認中の別行", url: "https://example.com/a", trial: null },
        ],
      }),
    );
    expect(screen.getByRole("link", { name: "分類前の資料" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "確認中の別行" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "分類未選択" })).toBeInTheDocument();
  });
});
