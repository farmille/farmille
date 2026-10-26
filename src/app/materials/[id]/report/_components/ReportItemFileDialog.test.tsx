import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

describe("画像の保存中の操作", () => {
  const getContext = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "getContext");
  afterEach(() => {
    vi.unstubAllGlobals();
    if (getContext !== undefined)
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", getContext);
  });

  it("保存が終わるまで、画像の削除・題の変更・編集・追加を止める", async () => {
    // happy-dom は画像を描けないので、写真の読み込みと縮小だけを差し替える
    vi.stubGlobal("createImageBitmap", async () => ({ width: 400, height: 300, close: () => {} }));
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: () => ({
        fillStyle: "",
        fillRect: () => {},
        drawImage: () => {},
        imageSmoothingQuality: "high",
      }),
    });
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
    await screen.findByRole("img", { name: "1枚目の画像" });
    fireEvent.click(screen.getByRole("button", { name: "ページに入れる" }));
    expect(screen.getByRole("button", { name: "1枚目の画像を削除" })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: /画像のタイトル/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /画像を編集する/ })).toBeDisabled();
    expect(input).toBeDisabled();
  });
});
