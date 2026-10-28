import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { describe, expect, it } from "vitest";

import { Form } from "./Form";
import { RadioGroup } from "./RadioGroup";

const standpoints = [
  { value: "farmer", label: "生産者", description: "農作物を栽培する方" },
  { value: "ja", label: "JAグループ職員（営農指導員など）" },
];

function captureSubmit(sink: FormData[]) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sink.push(new FormData(event.currentTarget));
  };
}

describe("RadioGroup", () => {
  it("必須の組は未選択なら送信を止め、選ぶと name で送る", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(
      <Form persist={false} onSubmit={captureSubmit(submitted)}>
        <RadioGroup
          label="あなたの立場"
          name="standpoint"
          options={standpoints}
          requirement="required"
          variant="cards"
        />
        <button type="submit">登録する</button>
      </Form>,
    );

    const group = screen.getByRole("radiogroup", { name: "あなたの立場" });
    expect(group).toHaveAttribute("aria-required", "true");
    expect(screen.getByRole("radio", { name: "生産者" })).toHaveAccessibleDescription(
      "農作物を栽培する方",
    );

    await user.click(screen.getByRole("button", { name: "登録する" }));
    expect(submitted).toHaveLength(0);
    expect(screen.getByRole("radio", { name: "生産者" })).toHaveAttribute("aria-invalid", "true");

    await user.click(screen.getByText("生産者"));
    expect(screen.getByRole("radio", { name: "生産者" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "登録する" }));
    expect(submitted[0]?.get("standpoint")).toBe("farmer");
  });

  it("name のある組は見出しで組に名前を付け、組のエラーを選択肢の説明に結ぶ", () => {
    render(
      <Form persist={false} errors={{ standpoint: "立場を選んでください。" }}>
        <RadioGroup
          label="あなたの立場"
          name="standpoint"
          options={[{ value: "farmer", label: "生産者" }]}
          requirement="required"
        />
      </Form>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("立場を選んでください。");
    expect(screen.getByRole("radiogroup", { name: "あなたの立場" })).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "生産者" }).getAttribute("aria-describedby")?.split(" "),
    ).toContain(alert.id);
  });
});
