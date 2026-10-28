import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReportFacts } from "./ReportFacts";

describe("ReportFacts", () => {
  it("作物・効果・立場を項目名つきで並べる", () => {
    render(
      <ReportFacts
        crop="ミニトマト（アイコ）"
        effects={["耐暑性改善", "しおれ軽減"]}
        standpoint="生産者"
      />,
    );
    const terms = screen.getAllByRole("term").map((term) => term.textContent);
    const values = screen.getAllByRole("definition").map((value) => value.textContent);
    expect(terms).toEqual(["作物", "効果", "立場"]);
    expect(values).toEqual(["ミニトマト（アイコ）", "耐暑性改善、しおれ軽減", "生産者"]);
  });

  it("値のない項目は出さない", () => {
    render(<ReportFacts crop={null} effects={[]} standpoint="生産者" />);
    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(["立場"]);
  });

  it("どの項目もなければ何も出さない", () => {
    const { container } = render(<ReportFacts crop={null} effects={[]} standpoint={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });
});
