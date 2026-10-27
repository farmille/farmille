import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReportGate } from "./ReportGate";

describe("実証詳細レポートの会員登録案内（見本の表示）", () => {
  it("登録とログインの両方に元のレポートへの戻り先を渡す", () => {
    render(<ReportGate reportPath="/reports/test-report" />);
    expect(screen.getByRole("link", { name: "無料会員登録して続きを読む" })).toHaveAttribute(
      "href",
      "/signup/general?next=%2Freports%2Ftest-report",
    );
    expect(screen.getByRole("link", { name: "ログインはこちら" })).toHaveAttribute(
      "href",
      "/login?next=%2Freports%2Ftest-report",
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "続きは無料会員登録で読めます",
    );
  });
});
