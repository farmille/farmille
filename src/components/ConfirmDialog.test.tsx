import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ConfirmDialog } from "./ConfirmDialog";
import { Input } from "./form/Input";

function RejectDialog({ submitted }: { submitted: FormData[] }) {
  return (
    <ConfirmDialog
      action={async (formData) => {
        submitted.push(formData);
      }}
      confirmLabel="却下する"
      pendingLabel="却下中…"
      title="この申請を却下しますか？"
      trigger={<button type="button">却下</button>}
    >
      <input defaultValue="application-1" name="applicationId" type="hidden" />
      {/* happy-dom の textarea は willValidate を持たず Base UI が検証しないので、ここでは Input で確かめる（Textarea は Story で確認） */}
      <Input label="却下の理由" name="reason" requirement="required" />
    </ConfirmDialog>
  );
}

describe("ConfirmDialog", () => {
  it("action は children の入力を含むフォームの値で呼ばれ、トリガーで開いたダイアログは終わると閉じる", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(<RejectDialog submitted={submitted} />);

    await user.click(screen.getByRole("button", { name: "却下" }));
    const dialog = await screen.findByRole("alertdialog", { name: "この申請を却下しますか？" });
    await user.type(within(dialog).getByLabelText("却下の理由"), "書類が不足しています");
    await user.click(within(dialog).getByRole("button", { name: "却下する" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(submitted).toHaveLength(1);
    expect(submitted[0]?.get("reason")).toBe("書類が不足しています");
    expect(submitted[0]?.get("applicationId")).toBe("application-1");
  });

  it("必須の理由が空なら送らず、開いたまま入力欄に誤りを示す", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(<RejectDialog submitted={submitted} />);

    await user.click(screen.getByRole("button", { name: "却下" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "却下する" }));

    expect(submitted).toHaveLength(0);
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("却下の理由")).toHaveAttribute("aria-invalid", "true");
  });

  it("onConfirm の処理中は開いたまま押せなくし、終わると閉じる", async () => {
    const user = userEvent.setup();
    const { promise, resolve } = Promise.withResolvers<void>();
    render(
      <ConfirmDialog
        confirmLabel="削除する"
        onConfirm={() => promise}
        pendingLabel="削除中…"
        title="感想口コミを削除しますか？"
        trigger={<button type="button">削除</button>}
      />,
    );

    await user.click(screen.getByRole("button", { name: "削除" }));
    const dialog = await screen.findByRole("alertdialog");
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "キャンセル" })).toHaveFocus(),
    );
    await user.click(within(dialog).getByRole("button", { name: "削除する" }));

    const pending = await within(dialog).findByRole("button", { name: "削除中…" });
    expect(pending).toHaveAttribute("aria-disabled", "true");
    expect(within(dialog).getByRole("button", { name: "キャンセル" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    await act(async () => resolve());
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });
});
