import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CropLine } from "./CropLine";

describe("CropLine", () => {
  it("作物名を1つずつ見つけられる形で「、」区切りに並べる", () => {
    const { container } = render(<CropLine crops={["トマト", "ミニトマト"]} />);
    expect(screen.getByText("トマト", { exact: true })).toBeInTheDocument();
    expect(screen.getByText("ミニトマト", { exact: true })).toBeInTheDocument();
    expect(container.textContent).toBe("作物：トマト、ミニトマト");
  });
});
