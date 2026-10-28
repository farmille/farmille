import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ReportItemFileDialog } from "./ReportItemFileDialog";

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

  it("ファイルの読み込みが終わるまで、ページに入れられない", async () => {
    // 1枚目はすぐ読み込み、2枚目は読み込みの途中で止めておく
    let calls = 0;
    let finish: () => void = () => {
      throw new Error("読み込みが開始されていません。");
    };
    vi.stubGlobal("createImageBitmap", async () => {
      calls += 1;
      if (calls > 1)
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
      return { width: 400, height: 300, close: () => {} };
    });
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
      target: {
        files: [
          new File(["x"], "1.png", { type: "image/png" }),
          new File(["x"], "2.png", { type: "image/png" }),
        ],
      },
    });
    await screen.findByRole("img", { name: "1枚目の画像" });
    expect(screen.getByRole("button", { name: "ページに入れる" })).toBeDisabled();
    expect(input).toBeDisabled();
    expect(screen.getByText("読み込みが終わると、次の写真・PDFを選べます")).toBeInTheDocument();
    finish();
    await screen.findByRole("img", { name: "2枚目の画像" });
    await waitFor(() => expect(input).toBeEnabled());
    expect(screen.getByRole("button", { name: "ページに入れる" })).toBeEnabled();
  });
});

describe("上げたがページに入れなかった画像", () => {
  const descriptors = {
    getContext: Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "getContext"),
    toBlob: Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "toBlob"),
  };
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    for (const [name, descriptor] of Object.entries(descriptors))
      if (descriptor !== undefined)
        Object.defineProperty(HTMLCanvasElement.prototype, name, descriptor);
  });

  it("途中まで上げた後にポップアップを捨てると、上げた画像を置き場から消す", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://storage.example.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
    // happy-dom は画像を描けず、置き場も無いので、描く手順と置き場への通信だけを差し替える
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
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      configurable: true,
      value: (done: (blob: Blob | null) => void) => done(new Blob(["x"], { type: "image/jpeg" })),
    });
    const userId = crypto.randomUUID();
    const reportId = crypto.randomUUID();
    const folder = `/storage/v1/object/report-media/${userId}/${reportId}/`;
    const requests: { method: string; url: string; body: string }[] = [];
    let uploads = 0;
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      requests.push({ method: request.method, url: request.url, body: await request.text() });
      if (request.method === "DELETE") return Response.json([]);
      if (new URL(request.url).pathname.startsWith(folder)) uploads += 1;
      // 2枚目の保存は失敗させ、途中まで上げた状態を作る
      return uploads === 1
        ? Response.json({ Key: "report-media/uploaded.jpg" })
        : Response.json({ message: "failed" }, { status: 500 });
    });
    render(
      <ReportItemFileDialog
        item={{ id: crypto.randomUUID(), mode: "file", name: "可販果収量", body: "", images: [] }}
        isNew={false}
        userId={userId}
        reportId={reportId}
        imageLimit={30}
        onCommit={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (input === null) throw new Error("ファイルの選択欄がありません。");
    fireEvent.change(input, {
      target: {
        files: [
          new File(["x"], "1.png", { type: "image/png" }),
          new File(["x"], "2.png", { type: "image/png" }),
        ],
      },
    });
    await screen.findByRole("img", { name: "2枚目の画像" });
    fireEvent.click(screen.getByRole("button", { name: "変更を反映する" }));
    await screen.findByText(/保存できた画像はそのまま残っています/);
    const uploaded = requests.find(
      (request) => request.method === "POST" && new URL(request.url).pathname.startsWith(folder),
    );
    if (uploaded === undefined) throw new Error("1枚目の画像を上げていません。");
    const uploadedPath = new URL(uploaded.url).pathname.replace(
      "/storage/v1/object/report-media/",
      "",
    );
    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    fireEvent.click(await screen.findByRole("button", { name: "記入をやめる" }));
    await waitFor(() =>
      expect(requests.find((request) => request.method === "DELETE")?.body).toContain(uploadedPath),
    );
  });
});
