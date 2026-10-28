import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BookmarkButton } from "./BookmarkButton";

afterEach(cleanup);
describe("投稿の保存ボタン", () => {
  it("「保存」の文字を添え、保存と解除を処理結果に合わせて「保存済み」と「保存」に切り替える", async () => {
    const action = vi.fn(async (saved: boolean) => saved);
    render(<BookmarkButton saved={false} action={action} />);
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "保存済み" }).getAttribute("aria-pressed")).toBe(
        "true",
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "保存済み" }).hasAttribute("disabled")).toBe(false),
    );
    expect(action).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: "保存済み" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "保存" }).getAttribute("aria-pressed")).toBe(
        "false",
      ),
    );
    expect(action).toHaveBeenLastCalledWith(false);
  });
  it("送信中は再送せず、処理完了まで保存状態を変えない", async () => {
    let finish: (saved: boolean) => void = () => {
      throw new Error("処理が未開始です。");
    };
    const action = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          finish = resolve;
        }),
    );
    render(<BookmarkButton saved={false} action={action} />);
    const button = screen.getByRole("button", { name: "保存" });
    fireEvent.click(button);
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(button);
    expect(action).toHaveBeenCalledTimes(1);
    finish(true);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "保存済み" }).hasAttribute("disabled")).toBe(false),
    );
  });
});
