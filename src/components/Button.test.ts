import { Toggle } from "@base-ui/react/toggle";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { css } from "../../styled-system/css";
import { token } from "../../styled-system/tokens";
import { Button } from "./Button";

afterEach(cleanup);

describe("短いラベルのボタン幅", () => {
  it("小さいボタンにも96pxの最小幅と左右余白を持たせる", () => {
    render(createElement(Button, { size: "sm" }, "保存"));
    expect(screen.getByRole("button", { name: "保存" })).toHaveClass(
      css({ minW: "button.sm", px: "6" }),
    );
    expect(token("sizes.button.sm")).toBe("96px");
  });

  it("標準ボタンには120pxの最小幅を持たせる", () => {
    render(createElement(Button, null, "保存"));
    expect(screen.getByRole("button", { name: "保存" })).toHaveClass(
      css({ minW: "button.md", px: "6" }),
    );
    expect(token("sizes.button.md")).toBe("120px");
  });
});

describe("Base UI との組み合わせ", () => {
  it("render に渡しても押下状態と操作を受け取る", () => {
    render(
      createElement(Toggle, {
        render: createElement(Button, { size: "sm", variant: "ghost" }, "保存"),
      }),
    );

    const button = screen.getByRole("button", { name: "保存" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("focusableWhenDisabled なら押せないままフォーカスを受ける", () => {
    render(createElement(Button, { disabled: true, focusableWhenDisabled: true }, "送信中…"));

    const button = screen.getByRole("button", { name: "送信中…" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    button.focus();
    expect(button).toHaveFocus();
  });
});
