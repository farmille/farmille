import { cleanup, render } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { HomeHeroModel } from "./HomeHeroModel";

afterEach(cleanup);

describe("ホームのヒーローの 3D モデル", () => {
  it("飾りなので支援技術から隠す", () => {
    const { container } = render(createElement(HomeHeroModel));
    expect(container.querySelector('[data-ui="home-hero-model"]')).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
