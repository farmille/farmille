import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReportItemFileDialog } from "./ReportItemFileDialog";

describe("資料の差し込みのファイルの選択", () => {
  it("読み込みが終わるまで、次のファイルを選べない", async () => {
    render(
      <ReportItemFileDialog
        item={{ id: crypto.randomUUID(), mode: "file", name: "可販果収量", body: "", images: [] }}
        isNew
        userId={crypto.randomUUID()}
        reportId={crypto.randomUUID()}
        imageLimit={30}
        onCommit={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (input === null) throw new Error("ファイルの選択欄がありません。");
    fireEvent.change(input, {
      target: { files: [new File(["x"], "畑.png", { type: "image/png" })] },
    });
    expect(input).toBeDisabled();
    expect(screen.getByText("読み込みが終わると、次の写真・PDFを選べます")).toBeInTheDocument();
    await waitFor(() => expect(input).toBeEnabled());
  });
});
