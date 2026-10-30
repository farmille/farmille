import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import * as actions from "../actions";
import { VerificationForm } from "./VerificationForm";

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

it("確認メールの送信が失敗しても入力を保ち、その値で再送できる", async () => {
  vi.spyOn(actions, "requestReceiptVerification")
    .mockResolvedValueOnce({ ok: false, error: "internal" })
    .mockResolvedValueOnce({ ok: true, data: true });
  const { container } = render(
    <PathnameContext.Provider value="/company-requests/receipts">
      <VerificationForm />
    </PathnameContext.Provider>,
  );
  const number = screen.getByRole("textbox", { name: /^受付番号/ });
  const email = screen.getByRole("textbox", { name: /^担当者メールアドレス/ });
  fireEvent.change(number, { target: { value: "12" } });
  fireEvent.change(email, { target: { value: "contact@example.test" } });
  const form = container.querySelector("form");
  if (form === null) throw new Error("確認フォームがありません。");

  fireEvent.submit(form);
  await waitFor(() => expect(actions.requestReceiptVerification).toHaveBeenCalledTimes(1));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "確認メールを送信" })).toBeEnabled(),
  );
  expect(number).toHaveValue("12");
  expect(email).toHaveValue("contact@example.test");

  fireEvent.submit(form);
  expect(
    await screen.findByText(
      "受付番号とメールアドレスが一致する場合は、確認メールをお送りしました。",
    ),
  ).toBeVisible();
  expect(actions.requestReceiptVerification).toHaveBeenLastCalledWith({
    receiptNumber: "12",
    email: "contact@example.test",
  });
});
