import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { describe, expect, it } from "vitest";

import { Form } from "./Form";
import { Select } from "./Select";

const prefectures = [
  { value: "08", label: "茨城県" },
  { value: "13", label: "東京都", description: "関東地方" },
];

function captureSubmit(sink: FormData[]) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sink.push(new FormData(event.currentTarget));
  };
}

describe("Select", () => {
  it("選んだ値を name で送り、トリガーは label で名前が付く", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(
      <Form persist={false} onSubmit={captureSubmit(submitted)}>
        <Select
          autoComplete="address-level1"
          label="都道府県"
          name="prefectureCode"
          options={prefectures}
          placeholder="選択してください"
          requirement="required"
        />
        <button type="submit">送信</button>
      </Form>,
    );

    expect(document.querySelector('input[name="prefectureCode"]')).toHaveAttribute(
      "autocomplete",
      "address-level1",
    );
    await user.click(screen.getByRole("button", { name: "送信" }));
    expect(submitted).toHaveLength(0);
    const trigger = screen.getByRole("combobox", { name: "都道府県" });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveTextContent("選択してください");

    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "東京都 関東地方" }));
    expect(trigger).toHaveTextContent("東京都");

    await user.click(screen.getByRole("button", { name: "送信" }));
    expect(submitted[0]?.get("prefectureCode")).toBe("13");
  });
});
