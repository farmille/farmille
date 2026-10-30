import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { afterEach, expect, it, vi } from "vitest";

import type { MaterialPageContent } from "@/lib/material-page-editor";
import * as actions from "../editor-actions";
import { MaterialPageEditor } from "./MaterialPageEditor";

const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  bfcacheId: "test",
} satisfies AppRouterInstance;

const content = {
  description: "製品説明",
  mainComponents: "",
  mechanism: "",
  links: [],
  images: [],
  usages: [],
  timings: [],
  registrations: [],
  relatedCompanies: [],
  certifications: [],
} satisfies MaterialPageContent;

afterEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

it("保存した版番号で再送信し、失敗した入力を残す", async () => {
  const versionId = "22222222-2222-4222-8222-222222222222";

  const save = vi
    .spyOn(actions, "saveMaterialPage")
    .mockResolvedValueOnce({ ok: true, versionId })
    .mockResolvedValueOnce({ ok: false, message: "保存できませんでした" });

  render(
    <AppRouterContext.Provider value={router}>
      <MaterialPageEditor
        materialId="11111111-1111-4111-8111-111111111111"
        initialContent={content}
        expectedVersion={null}
        pendingVersion={null}
        imageUrl={null}
      />
    </AppRouterContext.Provider>,
  );
  fireEvent.change(screen.getByLabelText("製品説明"), { target: { value: "保存する説明" } });
  fireEvent.click(screen.getByRole("button", { name: "下書きを保存" }));
  await screen.findByText("下書きを保存しました。");
  fireEvent.change(screen.getByLabelText("製品説明"), { target: { value: "失敗しても残す説明" } });
  fireEvent.click(screen.getByRole("button", { name: "下書きを保存" }));
  await screen.findByText("保存できませんでした");
  expect(screen.getByLabelText("製品説明")).toHaveValue("失敗しても残す説明");
  await waitFor(() =>
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ expectedVersion: versionId })),
  );
});
