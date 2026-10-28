import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { expect, it } from "vitest";
import { MaterialCard } from "./MaterialCard";

it("資材の画像を読み込めなくてもプレースホルダーが残る", () => {
  const { container } = render(
    createElement(MaterialCard, {
      href: "/materials/1",
      name: "テスト資材",
      maker: "テストメーカー",
      rating: 4.2,
      reviewCount: 12,
      imageSrc: "/missing-material-image.png",
      variant: "list",
    }),
  );
  const placeholder = container.querySelector<SVGElement>('svg[data-icon="image"]');
  expect(placeholder).not.toBeNull();
  fireEvent.error(screen.getByRole("img", { name: "テスト資材" }));
  expect(screen.queryByRole("img", { name: "テスト資材" })).not.toBeInTheDocument();
  expect(container).toContainElement(placeholder);
});
