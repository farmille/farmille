import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { SectionHeading } from "./SectionHeading";

afterEach(cleanup);

describe("SectionHeading", () => {
  it("通常のセクション見出しをh2にする", () => {
    render(createElement(SectionHeading, { title: "感想口コミ" }));
    expect(screen.getByRole("heading", { name: "感想口コミ", level: 2 })).toBeVisible();
  });
});
