import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ManufacturerCard } from "./manufacturer-card";

describe("<ManufacturerCard>", () => {
  const baseManufacturer = {
    id: "00000000-0000-0000-0000-000000000001",
    company_name: "Acme Bio",
    prefecture: "北海道",
    city: "札幌市",
    product_count: 3,
  };

  it("renders the company name as a heading-like element", () => {
    render(<ManufacturerCard manufacturer={baseManufacturer} />);
    expect(screen.getByText("Acme Bio")).toBeInTheDocument();
  });

  it("renders combined prefecture + city when both are present", () => {
    render(<ManufacturerCard manufacturer={baseManufacturer} />);
    expect(screen.getByText("北海道 札幌市")).toBeInTheDocument();
  });

  it("omits the location line when prefecture and city are both null", () => {
    render(
      <ManufacturerCard
        manufacturer={{ ...baseManufacturer, prefecture: null, city: null }}
      />,
    );
    expect(screen.queryByText(/北海道/)).not.toBeInTheDocument();
    expect(screen.queryByText(/札幌市/)).not.toBeInTheDocument();
  });

  it("renders only one of prefecture / city when the other is null", () => {
    render(
      <ManufacturerCard
        manufacturer={{ ...baseManufacturer, city: null }}
      />,
    );
    expect(screen.getByText("北海道")).toBeInTheDocument();
  });

  it("renders the product count badge", () => {
    render(<ManufacturerCard manufacturer={baseManufacturer} />);
    expect(screen.getByText("資材 3 件")).toBeInTheDocument();
  });

  it("renders 0-count manufacturers without crashing", () => {
    render(
      <ManufacturerCard
        manufacturer={{ ...baseManufacturer, product_count: 0 }}
      />,
    );
    expect(screen.getByText("資材 0 件")).toBeInTheDocument();
  });

  it("links to the detail page using the manufacturer id", () => {
    render(<ManufacturerCard manufacturer={baseManufacturer} />);
    const link = screen.getByTestId("manufacturer-card");
    expect(link).toHaveAttribute(
      "href",
      "/manufacturers/00000000-0000-0000-0000-000000000001",
    );
  });

  it("does NOT render forbidden Phase 13 placeholders (お悩み相談室 / 使用版 CTA)", () => {
    // Spec §13: these elements MUST NOT exist in the manufacturer UI.
    render(<ManufacturerCard manufacturer={baseManufacturer} />);
    expect(screen.queryByText(/お悩み相談室/)).not.toBeInTheDocument();
    expect(screen.queryByText(/使用版/)).not.toBeInTheDocument();
  });
});
