import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { ReportComparisonFields } from "./ReportComparisonFields";
import { ReportToaster } from "./ReportFormParts";
import { filledReport } from "./reportStoryFixture";

afterEach(cleanup);

function Harness() {
  const [input, setInput] = useState(filledReport);
  return (
    <>
      <ReportComparisonFields
        input={input}
        onChange={setInput}
        errors={{}}
        manualUnits={new Set()}
        onManualUnit={() => undefined}
      />
      <ReportToaster />
    </>
  );
}

describe("ReportComparisonFields", () => {
  it("区を削除したあとに入力を変えても、元に戻すはその入力を残したまま区を戻す", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "倍量区（2,000倍）を削除" }));
    expect(screen.getAllByLabelText(/^調査した範囲/)).toHaveLength(2);

    fireEvent.change(screen.getAllByLabelText(/^調査した範囲/)[0], {
      target: { value: "全株" },
    });
    fireEvent.click(await screen.findByRole("button", { name: "元に戻す" }));

    const scopes = screen.getAllByLabelText(/^調査した範囲/);
    expect(scopes).toHaveLength(3);
    expect(scopes[0]).toHaveValue("全株");
    expect(scopes[2]).toHaveValue("1区10株");
  });
});
