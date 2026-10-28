import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MaterialGenres } from "./MaterialGenres";

const names = ["アミノ酸", "フルボ酸・腐植酸", "海藻"];

describe("MaterialGenres", () => {
  it("上限を超えた資材ジャンルを「ほか n」にまとめる", () => {
    const { container } = render(<MaterialGenres names={names} max={1} />);
    expect(container.textContent).toBe("資材ジャンル：アミノ酸 ほか2");
  });

  it("上限がなければすべて並べる", () => {
    const { container } = render(<MaterialGenres names={names} />);
    expect(container.textContent).toBe("資材ジャンル：アミノ酸 ／ フルボ酸・腐植酸 ／ 海藻");
  });

  it("資材ジャンルがなければ何も出さない", () => {
    const { container } = render(<MaterialGenres names={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
