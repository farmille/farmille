import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { afterEach, expect, it, vi } from "vitest";

import { persistKey } from "@/components/form/persisted-input";
import * as sellerApplyActions from "./actions";
import { SellerApplyForm } from "./SellerApplyForm";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

it("控えの入力を復元し、エラー後の再送信にも同じ値を渡す", async () => {
  const values = {
    officialName: "試験資材株式会社",
    corporateNumber: "1234567890123",
    contactEmail: "contact@example.test",
    contactName: "試験担当者",
    location: "東京都",
    contactPhone: "03-1234-5678",
    materialRequestNotes: "試験資材の掲載を希望します。",
    websiteUrl: "https://example.test/",
    inviteCode: "TEST-INVITE",
  };
  sessionStorage.setItem(
    persistKey("seller-apply", "/sellers/apply"),
    JSON.stringify(
      Object.fromEntries(Object.entries(values).map(([name, value]) => [name, [value]])),
    ),
  );
  const action = vi.spyOn(sellerApplyActions, "sellerApplyAction").mockResolvedValue({
    status: "error",
    message: "申請内容を確認してください。",
    values,
  });
  render(
    <PathnameContext.Provider value="/sellers/apply">
      <SellerApplyForm />
    </PathnameContext.Provider>,
  );
  await waitFor(() => expect(screen.getByLabelText("法人名")).toHaveValue(values.officialName));
  expect(await screen.findByLabelText("招待コード")).toHaveValue(values.inviteCode);

  for (let attempt = 0; attempt < 2; attempt++) {
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "申請する" }));
    });
    expect(await screen.findByText("申請内容を確認してください。")).toBeVisible();
    const call = action.mock.lastCall;
    if (call === undefined) throw new Error("申請処理が呼ばれていません。");
    expect(Object.fromEntries(call[1])).toEqual(values);
    expect(screen.getByLabelText("法人名")).toHaveValue(values.officialName);
    expect(screen.getByLabelText("招待コード")).toHaveValue(values.inviteCode);
  }
});
