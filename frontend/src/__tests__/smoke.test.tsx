import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

function Hello() {
  return <h1>Farmille tests OK</h1>;
}

describe("vitest scaffolding", () => {
  it("renders react components via happy-dom", () => {
    render(<Hello />);
    expect(screen.getByRole("heading", { name: /Farmille tests OK/ })).toBeInTheDocument();
  });
});
