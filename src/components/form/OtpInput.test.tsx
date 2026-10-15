import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  it("label が1つの入力欄の名前になり、数字だけを name で送る", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(
      <Form onSubmit={captureSubmit(submitted)}>
        <OtpInput label="認証コード" name="code" requirement="required" />
        <button type="submit">登録を完了する</button>
      </Form>,
    );

    const input = screen.getByLabelText("認証コード");
    expect(input).toHaveAttribute("autocomplete", "one-time-code");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toBeRequired();

    await user.type(input, "12a3456");
    expect(input).toHaveValue("123456");
    await user.click(screen.getByRole("button", { name: "登録を完了する" }));

    expect(submitted[0]?.get("code")).toBe("123456");
  });

  it("必須で未入力なら送信を止める", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(
      <Form onSubmit={captureSubmit(submitted)}>
        <OtpInput label="認証コード" name="code" requirement="required" />
        <button type="submit">登録を完了する</button>
      </Form>,
    );

    await user.click(screen.getByRole("button", { name: "登録を完了する" }));

    expect(submitted).toHaveLength(0);
    expect(screen.getByLabelText("認証コード")).toHaveAttribute("aria-invalid", "true");
  });
});
