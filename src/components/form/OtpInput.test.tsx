import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, useStore } from "@tanstack/react-form";
import type { FormEvent } from "react";
import { describe, expect, it } from "vitest";

import { Form } from "./Form";
import { OtpInput } from "./OtpInput";

function captureSubmit(sink: FormData[]) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sink.push(new FormData(event.currentTarget));
  };
}

describe("OtpInput", () => {
  it("親のフォームが認証コードを保持し、入力とクリアを反映する", async () => {
    const user = userEvent.setup();
    function ControlledCode() {
      const form = useForm({ defaultValues: { code: "12" } });
      const code = useStore(form.store, (state) => state.values.code);
      return (
        <>
          <OtpInput
            label="認証コード"
            onValueChange={(next) => form.setFieldValue("code", next)}
            value={code}
          />
          <button onClick={() => form.setFieldValue("code", "")} type="button">
            入力を消す
          </button>
        </>
      );
    }
    render(<ControlledCode />);
    const input = screen.getByLabelText("認証コード");
    expect(input).toHaveValue("12");
    await user.type(input, "3456");
    expect(input).toHaveValue("123456");
    await user.click(screen.getByRole("button", { name: "入力を消す" }));
    expect(input).toHaveValue("");
  });

  it("label が1つの入力欄の名前になり、数字だけを name で送る", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(
      <Form persist={false} onSubmit={captureSubmit(submitted)}>
        <OtpInput label="認証コード" name="code" requirement="required" />
        <button type="submit">登録を完了する</button>
      </Form>,
    );

    await user.click(screen.getByRole("button", { name: "登録を完了する" }));
    expect(submitted).toHaveLength(0);
    const input = screen.getByLabelText("認証コード");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("autocomplete", "one-time-code");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toBeRequired();

    await user.type(input, "12a3456");
    expect(input).toHaveValue("123456");
    await user.click(screen.getByRole("button", { name: "登録を完了する" }));

    expect(submitted[0]?.get("code")).toBe("123456");
  });
});
