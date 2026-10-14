import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Avatar } from "./Avatar";

afterEach(cleanup);

describe("Avatar", () => {
  it("画像が無いときは表示名から決まるイラストを出す", () => {
    const { container } = render(<Avatar name="みどり農園" />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("同じ表示名なら同じ絵、別の表示名なら別の絵になる", () => {
    const draw = (name: string) => render(<Avatar name={name} />).container.innerHTML;
    expect(draw("みどり農園")).toBe(draw("みどり農園"));
    expect(draw("みどり農園")).not.toBe(draw("北のトマト農家"));
  });

  it("画像があるときはイラストを出さず画像を出す", () => {
    const { container } = render(<Avatar name="みどり農園" src="https://example.com/a.png" />);
    expect(container.querySelector("img")).not.toBeNull();
    expect(container.querySelector("svg")).toBeNull();
  });

  it("表示名を横に添える装飾なので支援技術には読み上げさせない", () => {
    const { container } = render(<Avatar name="みどり農園" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
