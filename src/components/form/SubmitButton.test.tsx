import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SubmitButton } from "./SubmitButton";

describe("SubmitButton", () => {
  it("送信中は文言を切り替え、押せないままフォーカスを残す", () => {
    render(
      <SubmitButton pending pendingLabel="登録中…">
        登録する
      </SubmitButton>,
    );

    const button = screen.getByRole("button", { name: "登録中…" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toHaveAttribute("disabled");
    button.focus();
    expect(button).toHaveFocus();
  });

  it("フォームの送信中（useFormStatus）も送信中として扱う", async () => {
    const user = userEvent.setup();
    const neverSettles = () => new Promise<void>(() => {});
    render(
      <form action={neverSettles}>
        <SubmitButton pendingLabel="保存中…">保存する</SubmitButton>
      </form>,
    );

    await user.click(screen.getByRole("button", { name: "保存する" }));

    const button = await screen.findByRole("button", { name: "保存中…" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveFocus();
  });

  it("disabled のときは送信中でなくても押せない", () => {
    render(
      <SubmitButton disabled pendingLabel="送信中…">
        送信する
      </SubmitButton>,
    );

    expect(screen.getByRole("button", { name: "送信する" })).toBeDisabled();
  });
});
