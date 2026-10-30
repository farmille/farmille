import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { afterEach, expect, it, vi } from "vitest";

import { savedMaterials } from "../_components/story-fixtures";
import * as savedActions from "./actions";
import { SavedList } from "./SavedList";

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
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it("解除中は対象だけ再送を止め、比較の選択を保持する", async () => {
  let complete: () => void = () => {
    throw new Error("解除が始まっていません。");
  };
  const unsave = vi
    .spyOn(savedActions, "unsaveMaterialAction")
    .mockImplementation(() => new Promise<void>((resolve) => (complete = resolve)));
  render(
    <AppRouterContext.Provider value={router}>
      <SavedList items={savedMaterials.slice(0, 2)} />
    </AppRouterContext.Provider>,
  );

  const [selected] = screen.getAllByRole("checkbox", { name: "比較に含める" });
  const [removing, other] = screen.getAllByRole("button", { name: "リストから外す" });
  fireEvent.click(selected);
  fireEvent.click(removing);
  await waitFor(() => expect(removing).toBeDisabled());
  expect(other).toBeEnabled();
  fireEvent.click(removing);
  expect(unsave).toHaveBeenCalledTimes(1);
  expect(unsave).toHaveBeenCalledWith("material-1", expect.any(FormData));

  await act(async () => complete());
  await waitFor(() => expect(removing).toBeEnabled());
  expect(selected).toBeChecked();
});
