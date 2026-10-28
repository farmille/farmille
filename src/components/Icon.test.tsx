import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Icon } from "./Icon";

describe("Icon", () => {
  it("意味を持つアイコンに読み上げ名を付ける", () => {
    const { rerender, container } = render(<Icon name="verified" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("svg")).toHaveAttribute("focusable", "false");
    rerender(<Icon name="verified" label="公式メーカー" />);
    expect(screen.getByRole("img", { name: "公式メーカー" })).not.toHaveAttribute("aria-hidden");
  });
});
