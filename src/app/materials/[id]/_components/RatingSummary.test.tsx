import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { RatingSummary } from "./RatingSummary";
import meta from "./RatingSummary.stories";

it("口コミ0件のときは評価を出さず、口コミがあれば平均と分布を出す", () => {
  const { container, rerender } = render(
    <RatingSummary {...meta.args} reviewCount={0} average={null} />,
  );

  expect(container).toBeEmptyDOMElement();
  rerender(<RatingSummary {...meta.args} />);
  expect(screen.getByText("4.2")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "星5の感想口コミ 9件" })).toBeInTheDocument();
});
