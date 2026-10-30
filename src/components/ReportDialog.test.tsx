import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { ReportActionState } from "@/server/actions/reports";
import { REPORT_REASON_OPTIONS } from "@/server/mutations/report-reasons";
import { ReportDialog } from "./ReportDialog";

function renderDialog(result: ReportActionState, submitted: FormData[]) {
  render(
    <ReportDialog
      action={async (_previousState, formData) => {
        submitted.push(formData);
        return result;
      }}
      reasonOptions={REPORT_REASON_OPTIONS}
      title="この感想口コミを通報する"
      triggerLabel="感想口コミを通報する"
    />,
  );
}

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "感想口コミを通報する" }));
  const dialog = await screen.findByRole("dialog", { name: "この感想口コミを通報する" });
  await user.click(within(dialog).getByRole("combobox", { name: "通報理由" }));
  await user.click(await screen.findByRole("option", { name: "誤った情報・誇大な効果表現" }));
  await user.type(within(dialog).getByLabelText("詳細（任意）"), "効果の表現が大げさです");
  await user.click(within(dialog).getByRole("button", { name: "通報する" }));
}

describe("ReportDialog", () => {
  it("通報理由が未選択なら送信しない", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    renderDialog({ status: "success" }, submitted);
    await user.click(screen.getByRole("button", { name: "感想口コミを通報する" }));
    const dialog = await screen.findByRole("dialog", { name: "この感想口コミを通報する" });
    await user.click(within(dialog).getByRole("button", { name: "通報する" }));

    expect(submitted).toEqual([]);
    expect(within(dialog).getByRole("combobox", { name: "通報理由" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("選んだ理由と詳細を送り、受け付けたら同じモーダルで完了を伝える", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    renderDialog({ status: "success" }, submitted);

    await fillAndSubmit(user);

    expect(await screen.findByRole("dialog", { name: "通報を受け付けました" })).toBeVisible();
    expect(submitted[0]?.get("reasonCode")).toBe("false_info");
    expect(submitted[0]?.get("detail")).toBe("効果の表現が大げさです");
  });

  it("想定内のエラーはフォームの下に alert で示し、モーダルを開いたままにする", async () => {
    const user = userEvent.setup();
    renderDialog({ status: "error", message: "この感想口コミはすでに通報済みです。" }, []);

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "この感想口コミはすでに通報済みです。",
    );
    expect(screen.getByRole("dialog", { name: "この感想口コミを通報する" })).toBeVisible();
    expect(screen.getByRole("combobox", { name: "通報理由" })).toHaveTextContent(
      "誤った情報・誇大な効果表現",
    );
    expect(screen.getByLabelText("詳細（任意）")).toHaveValue("効果の表現が大げさです");
  });
});
