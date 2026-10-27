import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Chip } from "./Chip";

function setWidths(element: HTMLElement, scrollWidth: number, clientWidth: number): HTMLElement {
  Object.defineProperty(element, "scrollWidth", { configurable: true, value: scrollWidth });
  Object.defineProperty(element, "clientWidth", { configurable: true, value: clientWidth });
  return element;
}

describe("Chip", () => {
  it("入りきらない名前はホバーで全文を出す", async () => {
    const user = userEvent.setup();
    render(<Chip>西洋芝（ケンタッキーブルーグラス）</Chip>);
    const label = setWidths(screen.getByText("西洋芝（ケンタッキーブルーグラス）"), 240, 120);

    await user.hover(label);

    await waitFor(() => {
      expect(screen.getAllByText("西洋芝（ケンタッキーブルーグラス）")).toHaveLength(2);
    });
  });

  it("収まっている名前はホバーしても同じ名前を重ねて出さない", async () => {
    const user = userEvent.setup();
    render(<Chip>トマト</Chip>);
    const label = setWidths(screen.getByText("トマト"), 80, 120);

    await user.hover(label);
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(screen.getAllByText("トマト")).toHaveLength(1);
  });

  it("略称のチップは正式名称を読み上げ、ホバーで正式名称を出す", async () => {
    const user = userEvent.setup();
    render(<Chip fullLabel="アミノ酸、ペプチド、タンパク質加水分解物">アミノ酸</Chip>);

    expect(screen.getByText("アミノ酸")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("アミノ酸、ペプチド、タンパク質加水分解物")).toBeInTheDocument();

    await user.hover(screen.getByText("アミノ酸"));

    await waitFor(() => {
      expect(screen.getAllByText("アミノ酸、ペプチド、タンパク質加水分解物")).toHaveLength(2);
    });
  });
});
