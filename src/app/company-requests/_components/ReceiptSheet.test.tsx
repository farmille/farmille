import { render, screen } from "@testing-library/react";
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
    [transferOutReceipt, ["対象資材", "申請者", "移行先企業", "添付資料", "確認事項"]],
    [transferInReceipt, ["対象資材", "申請者", "移行の経緯", "添付資料", "確認事項"]],
  ])("申請の種類にある区分だけを並べる", (receipt, names) => {
    render(<ReceiptSheet receiptDocument={applicationReceiptDocument(receipt)} />);
    expect(sectionNames()).toEqual(names);
  });

  it("受付番号を保存した値のまま出し、資材に番号を振り、添付資料のファイル名をダウンロードのリンクにする", () => {
    const receiptDocument = applicationReceiptDocument(registrationReceipt);
    render(<ReceiptSheet receiptDocument={receiptDocument} />);
    expect(sectionNames()).toEqual(["対象資材", "申請者", "添付資料", "確認事項"]);
    expect(screen.getByText("128")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    const [file] = receiptDocument.attachments;
    if (file === undefined) throw new Error("添付資料が必要です");
    expect(screen.getByRole("link", { name: file.fileName })).toHaveAttribute(
      "href",
      `/api/company-application-evidence/${file.id}`,
    );
  });

  it("法人番号・確認事項・添付資料のない申請は、確認事項の区分を出さず、添付資料を「なし」とする", () => {
    render(
      <ReceiptSheet
        receiptDocument={applicationReceiptDocument(removalReceipt, {
          omitMissingCorporateNumber: true,
        })}
      />,
    );
    expect(sectionNames()).toEqual(["対象資材", "申請者", "添付資料"]);
    expect(screen.queryByText("法人番号")).toBeNull();
    expect(screen.getByText("なし")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
