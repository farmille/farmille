import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Avatar } from "./Avatar";

afterEach(cleanup);

describe("Avatar", () => {
  it("画像が無いときは表示名から決まるイラストを出す", () => {
    const { container, rerender } = render(<Avatar name="みどり農園" />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
    rerender(<Avatar name="みどり農園" src="https://example.com/a.png" />);
    expect(container.querySelector("img")).not.toBeNull();
    expect(container.querySelector("svg")).toBeNull();
  });

  it("表示名を横に添える装飾なので支援技術には読み上げさせない", () => {
    const { container } = render(<Avatar name="みどり農園" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
