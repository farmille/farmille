import { cleanup, render, screen } from "@testing-library/react";
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
