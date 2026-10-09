import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Dialog, DialogActions, DialogClose } from "./Dialog";

afterEach(cleanup);

describe("Dialog", () => {
  it("トリガーで開き、見出しを名前に持ち、閉じるボタンで閉じてトリガーへ戻る", async () => {
    render(
      <Dialog
        title="この感想口コミを通報する"
        description="不適切な内容を見つけた場合にお知らせください。"
        trigger={<button type="button">通報する</button>}
      >
        <DialogActions>
          <DialogClose>キャンセル</DialogClose>
        </DialogActions>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "通報する" });
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "この感想口コミを通報する" });
    expect(dialog.getAttribute("aria-describedby")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
