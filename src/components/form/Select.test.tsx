import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { describe, expect, it } from "vitest";

import { Field } from "./Field";
import { Form } from "./Form";
import { Select } from "./Select";

const prefectures = [
  { value: "08", label: "茨城県" },
  { value: "13", label: "東京都" },
];

function captureSubmit(sink: FormData[]) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sink.push(new FormData(event.currentTarget));
  };
}

describe("Select", () => {
  it("選んだ値を Field の name で送り、トリガーは見出しで名前が付く", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(
      <Form onSubmit={captureSubmit(submitted)}>
        <Field label="都道府県" name="prefectureCode" requirement="required">
          <Select options={prefectures} placeholder="選択してください" />
        </Field>
        <button type="submit">送信</button>
      </Form>,
    );

    const trigger = screen.getByRole("combobox", { name: "都道府県" });
    expect(trigger).toHaveTextContent("選択してください");

    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "東京都" }));
    expect(trigger).toHaveTextContent("東京都");

    await user.click(screen.getByRole("button", { name: "送信" }));
    expect(submitted[0]?.get("prefectureCode")).toBe("13");
  });

  it("必須で未選択なら送信を止める", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(
      <Form onSubmit={captureSubmit(submitted)}>
        <Field label="都道府県" name="prefectureCode" requirement="required">
          <Select options={prefectures} placeholder="選択してください" />
        </Field>
        <button type="submit">送信</button>
      </Form>,
    );

    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(submitted).toHaveLength(0);
    expect(screen.getByRole("combobox", { name: "都道府県" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("説明付きの選択肢は「ラベル 説明」で読み上げる", async () => {
    const user = userEvent.setup();
    render(
      <Select
        aria-label="作目"
        options={[
          { value: "tomato", label: "トマト", description: "なす科果菜類" },
          { value: "cucumber", label: "きゅうり", description: "うり科果菜類" },
        ]}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "作目" }));

    expect(await screen.findByRole("option", { name: "トマト なす科果菜類" })).toBeInTheDocument();
  });
});
