import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { css } from "../../styled-system/css";

import { MaterialCard, type MaterialCardProps } from "./MaterialCard";

const baseProps = {
  name: "テスト資材",
  maker: "テストメーカー",
  rating: 4.2,
  reviewCount: 12,
  imageSrc: "/missing-material-image.png",
} satisfies MaterialCardProps;

describe("MaterialCard", () => {
  it.each(["scroll", "list"] satisfies NonNullable<MaterialCardProps["variant"]>[])(
    "%s表示で画像とプレースホルダーを重ね、読み込み失敗後はプレースホルダーを残す",
    (variant) => {
      const { container } = render(createElement(MaterialCard, { ...baseProps, variant }));

      const card = container.querySelector(`[data-ui="material-card"][data-variant="${variant}"]`);
      const imageBox = card?.querySelector('[data-ui="material-card-image"]') ?? null;
      const placeholder =
        imageBox?.querySelector<HTMLElement>("[translate='no'][aria-hidden='true']") ?? null;
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
