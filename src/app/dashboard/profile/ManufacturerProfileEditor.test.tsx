import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { afterEach, expect, it, vi } from "vitest";

import * as actions from "./actions";
import { ManufacturerProfileEditor } from "./ManufacturerProfileEditor";

const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  bfcacheId: "test",
} satisfies AppRouterInstance;

afterEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

it("ロゴのアップロード結果を次の保存へ渡す", async () => {
  const logoUrl = "https://example.com/logo.png";
  vi.spyOn(actions, "uploadLogo").mockResolvedValue({ ok: true, url: logoUrl });
  const save = vi.spyOn(actions, "saveManufacturerProfile").mockResolvedValue({
    ok: true,
    versionId: "22222222-2222-4222-8222-222222222222",
  });
  render(
    <AppRouterContext.Provider value={router}>
      <ManufacturerProfileEditor
        sellerId="11111111-1111-4111-8111-111111111111"
        name="農業資材株式会社"
        regionScope={null}
        initialContent={{ profileText: "会社紹介", logoUrl: "", websiteUrl: "" }}
        expectedVersion={null}
        pendingVersion={null}
      />
    </AppRouterContext.Provider>,
  );
  fireEvent.change(screen.getByLabelText("ロゴ画像"), {
    target: { files: [new File(["logo"], "logo.png", { type: "image/png" })] },
  });
  await screen.findByText(
    "ロゴをアップロードしました。下書き保存または表現確認への送信をしてください。",
  );
  fireEvent.click(screen.getByRole("button", { name: "下書きを保存" }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ content: expect.objectContaining({ logoUrl }) }),
    ),
  );
});
