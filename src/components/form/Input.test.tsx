import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Input } from "./Input";

describe("Input", () => {
  it("目のボタンでパスワードの表示と非表示を切り替える", async () => {
    const user = userEvent.setup();
    render(
      <Input aria-label="パスワード" defaultValue="farmille-pass" revealable type="password" />,
    );

    const field = screen.getByLabelText("パスワード");
    expect(field).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "パスワードを表示する" }));
    expect(field).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "パスワードを隠す" }));
    expect(field).toHaveAttribute("type", "password");
  });
});
