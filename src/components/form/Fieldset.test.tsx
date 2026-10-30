import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Checkbox } from "./Checkbox";
import { Field } from "./Field";
import { Fieldset } from "./Fieldset";
import { Form } from "./Form";
import { Input } from "./Input";

describe("Fieldset", () => {
  it("name の無い組は中の Field がそれぞれ自分の name とエラーを持つ", () => {
    render(
      <Form persist={false} errors={{ givenName: "名を入力してください。" }}>
        <Fieldset legend="本名" lead="姓と名を分けて入力します" visibility="private">
          <Field hideLabel label="姓" name="familyName">
            <Input label={null} />
          </Field>
          <Field hideLabel label="名" name="givenName">
            <Input label={null} />
          </Field>
        </Fieldset>
      </Form>,
    );

    const group = screen.getByRole("group", { name: "本名" });
    expect(group).toHaveAccessibleDescription(/公開されません.*姓と名を分けて入力します/);
    expect(screen.getByRole("textbox", { name: "名" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("textbox", { name: "姓" })).not.toHaveAttribute("aria-invalid");
    expect(screen.getByRole("alert")).toHaveTextContent("名を入力してください。");
  });

  it("見出しを隠しても組の名前は残り、中の行は札なしで組の必須を受け継ぐ", () => {
    render(
      <Fieldset hideLegend legend="確認事項" requirement="required">
        <Field name="consent.0">
          <Checkbox>内容を確認しました</Checkbox>
        </Field>
      </Fieldset>,
    );

    expect(screen.getByRole("group", { name: "確認事項" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "内容を確認しました" })).toBeRequired();
  });

  it("name の無い組にエラーを出し入れしても、中の入力は作り直されない", () => {
    const { rerender } = render(
      <Fieldset legend="使用対象作目">
        <Input defaultValue="トマト" hideLabel label="作物名" />
      </Fieldset>,
    );

    const input = screen.getByRole("textbox", { name: "作物名" });

    rerender(
      <Fieldset error="使用対象作目を選んでください" legend="使用対象作目">
        <Input defaultValue="トマト" hideLabel label="作物名" />
      </Fieldset>,
    );

    expect(screen.getByRole("textbox", { name: "作物名" })).toBe(input);
    expect(screen.getByRole("alert")).toHaveTextContent("使用対象作目を選んでください");
    expect(screen.getByRole("group", { name: "使用対象作目" })).toHaveAccessibleDescription(
      "使用対象作目を選んでください",
    );
  });
});
