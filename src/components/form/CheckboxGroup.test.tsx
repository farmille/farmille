import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { describe, expect, it } from "vitest";

import { CheckboxGroup } from "./CheckboxGroup";
import { Form } from "./Form";

const timings = [
  { value: "before", label: "栽培開始前" },
  { value: "planting", label: "播種・定植時" },
  { value: "growing", label: "生育期" },
];

function captureSubmit(sink: FormData[]) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sink.push(new FormData(event.currentTarget));
  };
}

describe("CheckboxGroup", () => {
  it("チェックした値を選択肢の順に1件ずつ name で送る", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(
      <Form persist={false} onSubmit={captureSubmit(submitted)}>
        <CheckboxGroup label="使用時期" name="timings" options={timings} variant="chips" />
        <button type="submit">保存</button>
      </Form>,
    );

    expect(screen.getByRole("group", { name: "使用時期" })).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "播種・定植時" }));
    await user.click(screen.getByRole("checkbox", { name: "栽培開始前" }));
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(submitted[0]?.getAll("timings")).toEqual(["before", "planting"]);
  });

  it("上限に達すると、選んでいない選択肢を押せなくする", async () => {
    const user = userEvent.setup();
    const changes: string[][] = [];
    render(
      <CheckboxGroup
        hideLabel
        label="比べる資材"
        limit={2}
        name="compare"
        onValueChange={(value) => changes.push(value)}
        options={timings}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: "生育期" }));
    await user.click(screen.getByRole("checkbox", { name: "栽培開始前" }));

    expect(changes.at(-1)).toEqual(["before", "growing"]);
    expect(screen.getByRole("checkbox", { name: "播種・定植時" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "生育期" })).toBeEnabled();
  });
});
