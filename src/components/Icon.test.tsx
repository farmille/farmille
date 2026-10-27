import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Icon, iconNames } from "./Icon";

describe("Icon", () => {
  it.each(iconNames)("%sを装飾用のSVGとして描画する", (name) => {
    const { container } = render(<Icon name={name} size="sm" />);
    const icon = container.querySelector("svg");
    expect(icon).toHaveAttribute("data-icon", name);
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("focusable", "false");
    expect(icon?.children.length).toBeGreaterThan(0);
    expect(container).toHaveTextContent("");
  });

  it("意味を持つアイコンに読み上げ名を付ける", () => {
    render(<Icon name="verified" label="公式メーカー" />);
    expect(screen.getByRole("img", { name: "公式メーカー" })).not.toHaveAttribute("aria-hidden");
  });
});
