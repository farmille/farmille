import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReportPagePreview } from "./ReportPagePreview";
import { itemsFromInput } from "./report-page-state";
import { legacyMediaReport } from "./reportStoryFixture";

describe("プレビューの関連資料", () => {
  it("署名付き URL がある資料は、名前のリンクで開ける", () => {
    const [document] = legacyMediaReport.documents;
    if (document === undefined) throw new Error("記入例に関連資料がありません。");
    render(
      <ReportPagePreview
        open
        onOpenChange={vi.fn()}
        input={legacyMediaReport}
        items={itemsFromInput(legacyMediaReport)}
        title="スキーポン 実証詳細レポート｜トマト"
        materialName="スキーポン"
        manufacturerName="ファーム技研"
        cropName="トマト"
        authorName="しおさい農園"
        documentUrls={[{ id: document.id, url: "https://example.test/signed/document.pdf" }]}
        missing={[]}
      />,
    );
    expect(screen.getByRole("link", { name: document.name })).toHaveAttribute(
      "href",
      "https://example.test/signed/document.pdf",
    );
  });

  it("保存済みの見出しは、公開の記事と同じく決まった見出しより優先して出す", () => {
    render(
      <ReportPagePreview
        open
        onOpenChange={vi.fn()}
        input={{
          ...legacyMediaReport,
          headings: [
            { section: "results", title: "使ってみた結果" },
            { section: "plots", title: "試した区" },
          ],
        }}
        items={itemsFromInput(legacyMediaReport)}
        title="スキーポン 実証詳細レポート｜トマト"
        materialName="スキーポン"
        manufacturerName="ファーム技研"
        cropName="トマト"
        authorName="しおさい農園"
        documentUrls={[]}
        missing={[]}
      />,
    );
    expect(screen.getByRole("heading", { name: "使ってみた結果" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "試した区" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "結果・感想" })).toBeNull();
    expect(screen.getByRole("heading", { name: "期待した効果" })).toBeInTheDocument();
  });
});
