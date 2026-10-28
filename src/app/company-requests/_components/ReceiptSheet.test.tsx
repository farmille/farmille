import { cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { applicationReceiptDocument } from "@/lib/company-application-receipt";

import { ReceiptSheet } from "./ReceiptSheet";
import {
  registrationReceipt,
  removalReceipt,
  transferInReceipt,
  transferOutReceipt,
} from "./story-fixtures";

const sectionNames = () =>
  screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);

describe("申請受付票の用紙", () => {
  it.each([
    [registrationReceipt, ["対象資材", "申請者", "添付資料", "確認事項"]],
    [removalReceipt, ["対象資材", "申請者", "添付資料"]],
    [transferOutReceipt, ["対象資材", "申請者", "移行先企業", "添付資料", "確認事項"]],
    [transferInReceipt, ["対象資材", "申請者", "移行の経緯", "添付資料", "確認事項"]],
  ])("申請の種類にある区分だけを並べる", (receipt, names) => {
    render(<ReceiptSheet receiptDocument={applicationReceiptDocument(receipt)} />);
    expect(sectionNames()).toEqual(names);
  });

  it("受付番号を保存した値のまま出し、資材に番号を振り、添付資料のファイル名をダウンロードのリンクにする", () => {
    const receiptDocument = applicationReceiptDocument(registrationReceipt);
    render(<ReceiptSheet receiptDocument={receiptDocument} />);
    const [file] = receiptDocument.attachments;
    if (file === undefined) throw new Error("添付資料が必要です");
    expect(screen.getByRole("link", { name: file.fileName })).toHaveAttribute(
      "href",
      `/api/company-application-evidence/${file.id}`,
    );
    cleanup();
    render(<ReceiptSheet receiptDocument={applicationReceiptDocument(removalReceipt)} />);
    expect(screen.getByText("なし")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
