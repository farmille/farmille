import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { css } from "../../styled-system/css";

import { MaterialCard, type MaterialCardProps } from "./MaterialCard";

const baseProps = {
  href: "/materials/1",
  name: "テスト資材",
  maker: "テストメーカー",
  rating: 4.2,
  reviewCount: 12,
  imageSrc: "/missing-material-image.png",
};

const variants = [
  { ...baseProps, variant: "scroll" },
  { ...baseProps, variant: "list" },
  {
    ...baseProps,
    variant: "rich",
    reportCount: 3,
    savedCount: 5,
    categories: [],
    evidence: { direct: [], groups: [] },
  },
] satisfies MaterialCardProps[];

describe("MaterialCard", () => {
  it.each(variants)(
    "$variant表示で画像とプレースホルダーを重ね、読み込み失敗後はプレースホルダーを残す",
    (props) => {
      const { variant } = props;
      const { container } = render(createElement(MaterialCard, props));

      const card = container.querySelector(`[data-ui="material-card"][data-variant="${variant}"]`);
      const imageBox = card?.querySelector('[data-ui="material-card-image"]') ?? null;
      const placeholder =
        imageBox?.querySelector<SVGSVGElement>("svg[data-icon='image'][aria-hidden='true']") ??
        null;
      const image = screen.getByRole("img", { name: baseProps.name });
      const imageLayer = css({ gridArea: "1 / 1" });

      expect(imageBox).toContainElement(image);
      expect(imageBox).toContainElement(placeholder);
      expect(image).toHaveClass(imageLayer);
      expect(placeholder).toHaveClass(imageLayer);

      fireEvent.error(image);

      expect(screen.queryByRole("img", { name: baseProps.name })).not.toBeInTheDocument();
      expect(imageBox).toContainElement(placeholder);
    },
  );
});
