import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { ToggleGroup } from "./ToggleGroup";

const effects = [
  { value: "vigor", label: "樹勢改善" },
  { value: "rooting", label: "発根促進" },
  { value: "yield", label: "収量増加" },
];

function Harness({ multiple, limit }: { multiple?: boolean; limit?: number }) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <>
      <ToggleGroup
        aria-label="使用目的"
        limit={limit}
        multiple={multiple}
        onValueChange={setValue}
        options={effects}
        value={value}
      />
      <output>{value.join(",")}</output>
    </>
  );
}

describe("ToggleGroup", () => {
  it("押しボタンは aria-pressed で状態を伝え、複数選択の値は選択肢の並びで返す", async () => {
    const user = userEvent.setup();
    render(<Harness multiple />);

    expect(screen.getByRole("group", { name: "使用目的" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "収量増加" }));
    await user.click(screen.getByRole("button", { name: "樹勢改善" }));

    expect(screen.getByRole("button", { name: "樹勢改善" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("status")).toHaveTextContent("vigor,yield");

    await user.click(screen.getByRole("button", { name: "収量増加" }));
    expect(screen.getByRole("button", { name: "収量増加" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("status")).toHaveTextContent(/^vigor$/);
  });

  it("上限に達すると押していない選択肢を押せなくする", async () => {
    const user = userEvent.setup();
    render(<Harness limit={2} multiple />);

    await user.click(screen.getByRole("button", { name: "樹勢改善" }));
    await user.click(screen.getByRole("button", { name: "発根促進" }));

    expect(screen.getByRole("button", { name: "収量増加" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "樹勢改善" })).toBeEnabled();
  });
});
