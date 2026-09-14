import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { SectionHeading } from "./SectionHeading";

afterEach(cleanup);

describe("SectionHeading", () => {
  it("通常のセクション見出しをh2にする", () => {
    render(createElement(SectionHeading, { title: "レビュー" }));
    expect(screen.getByRole("heading", { name: "レビュー", level: 2 })).toBeVisible();
  });

  it("ページ見出しにはh1を指定できる", () => {
    render(createElement(SectionHeading, { as: "h1", title: "掲載資材一覧" }));
    expect(screen.getByRole("heading", { name: "掲載資材一覧", level: 1 })).toBeVisible();
  });
});
