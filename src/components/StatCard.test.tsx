import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StatCard } from "./StatCard";

afterEach(cleanup);

describe("StatCard", () => {
  it("呼び出し側の className をカード要素に付ける", () => {
    render(<StatCard className="admin-stat" label="未処理の通報" value={3} />);
    expect(screen.getByText("未処理の通報").parentElement).toHaveClass("admin-stat");
  });
});
