import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import { applicationCopy } from "@/lib/company-application-copy";
import { persistKey, writePersisted } from "@/components/form/persisted-input";
import * as actions from "../actions";
import { CompanyApplicationForm } from "./CompanyApplicationForm";
import type { ContactDefaults } from "./ContactFields";

const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  bfcacheId: "test",
} satisfies AppRouterInstance;
const pathname = "/dashboard/applications/new/transfer_out";

const intentId = "11111111-1111-4111-8111-111111111111";
const contact: ContactDefaults = {
  companyName: "しおさい資材株式会社",
  corporateNumber: "1234567890123",
  accountId: "farmille-demo",
  contactName: "金子 太郎",
  department: "営業部",
  email: "contact@example.test",
  phone: "03-1234-5678",
};

function renderRestoredForm() {
  const restored = Object.fromEntries<string[]>([
    [`${intentId}.materialName`, ["土づくり資材"]],
    [`${intentId}.materialUrl`, ["https://www.farmille.com/materials/example"]],
    [`${intentId}.evidenceUrl`, ["https://example.test/package"]],
    ["applicationDate", ["2026-10-30"]],
    ["signerName", ["金子 太郎"]],
    ...Object.entries(contact).flatMap(([name, value]) => [
      [name, [value]] satisfies [string, string[]],
      [`destination.${name}`, [name === "companyName" ? "移行先株式会社" : value]] satisfies [
        string,
        string[],
      ],
    ]),
    ...applicationCopy.transfer_out.consents.map(
      (_, index) => [`consent.${index}`, ["on"]] satisfies [string, string[]],
    ),
  ]);
  writePersisted(persistKey("application", pathname), restored);
  return render(
    <PathnameContext.Provider value={pathname}>
      <AppRouterContext.Provider value={router}>
        <CompanyApplicationForm
          intentId={intentId}
          kind="transfer_out"
          defaults={contact}
          recipient={contact.email}
        />
      </AppRouterContext.Provider>
    </PathnameContext.Provider>,
  );
}

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  router.push.mockClear();
});

describe("企業申請の入力", () => {
  it("控えから戻した移行先・資材・同意を送り、送信エラー後も再送できる", async () => {
    vi.spyOn(actions, "submitApplication")
      .mockResolvedValueOnce({ ok: false, error: "internal" })
      .mockResolvedValueOnce({ ok: true, data: intentId });
    const { container } = renderRestoredForm();
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "資材名" })).toHaveValue("土づくり資材"),
    );
    const form = container.querySelector("form");
    if (form === null) throw new Error("申請フォームがありません。");

    fireEvent.submit(form);
    await waitFor(() => expect(actions.submitApplication).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "内容を確認して申請する" })).toBeEnabled(),
    );
    expect(screen.getByRole("textbox", { name: "資材名" })).toHaveValue("土づくり資材");
    expect(actions.submitApplication).toHaveBeenLastCalledWith({
      intentId,
      input: expect.objectContaining({
        kind: "transfer_out",
        companyName: contact.companyName,
        destination: expect.objectContaining({ companyName: "移行先株式会社" }),
        items: [expect.objectContaining({ id: intentId, materialName: "土づくり資材" })],
        signerName: "金子 太郎",
        consents: applicationCopy.transfer_out.consents.map(() => true),
      }),
    });

    fireEvent.submit(form);
    await waitFor(() => expect(actions.submitApplication).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(`/dashboard/applications/${intentId}`),
    );
  });
});
