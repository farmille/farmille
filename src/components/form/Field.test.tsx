import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { describe, expect, it } from "vitest";

import { Field } from "./Field";
import { Fieldset } from "./Fieldset";
import { Form } from "./Form";
import { Input } from "./Input";
import { Textarea } from "./Textarea";

function captureSubmit(sink: FormData[]) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sink.push(new FormData(event.currentTarget));
  };
}

describe("Field", () => {
  it("見出しの文字だけを入力の名前にし、Field の name で送る", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(
      <Form onSubmit={captureSubmit(submitted)}>
        <Field label="ニックネーム" name="handle" requirement="required" visibility="public">
          <Input name="ignored" />
        </Field>
        <button type="submit">送信</button>
      </Form>,
    );

    const input = screen.getByRole("textbox", { name: "ニックネーム" });
    expect(input).toBeRequired();
    await user.type(input, "農家の山田");
    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(submitted).toHaveLength(1);
    expect(submitted[0]?.get("handle")).toBe("農家の山田");
    expect(submitted[0]?.has("ignored")).toBe(false);
  });

  it("requirement を省いた Field は囲む Fieldset の必須に従い、任意なら必須を外す", () => {
    render(
      <Fieldset legend="本名" requirement="required">
        <Field hideLabel label="姓" name="familyName">
          <Input />
        </Field>
        <Field label="ミドルネーム" name="middleName" requirement="optional">
          <Input />
        </Field>
      </Fieldset>,
    );

    expect(screen.getByRole("textbox", { name: "姓" })).toBeRequired();
    expect(screen.getByRole("textbox", { name: "ミドルネーム" })).not.toBeRequired();
  });

  it("案内と公開範囲を入力の説明に結びつける", () => {
    render(
      <Field
        description="本名でなくてOKです"
        label="ニックネーム"
        lead="投稿に表示されます"
        name="handle"
        visibility="private"
      >
        <Input />
      </Field>,
    );

    expect(screen.getByRole("textbox", { name: "ニックネーム" })).toHaveAccessibleDescription(
      /^(?=.*公開されません)(?=.*投稿に表示されます)(?=.*本名でなくてOKです)/,
    );
  });

  it("Form の errors を role=alert で出して入力の説明に結び、入力を変えると消す", async () => {
    const user = userEvent.setup();
    render(
      <Form errors={{ handle: "このハンドルネームはすでに使われています。" }}>
        <Field label="ニックネーム" name="handle">
          <Input defaultValue="山田" />
        </Field>
      </Form>,
    );

    const input = screen.getByRole("textbox", { name: "ニックネーム" });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("このハンドルネームはすでに使われています。");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(alert.id);

    await user.type(input, "太郎");
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(input).not.toHaveAttribute("aria-invalid", "true");
  });

  it("画面側で判定したエラーは Form の外でも出す", () => {
    render(
      <Field error="数値を入力してください" label="調査した範囲" name="range">
        <Input />
      </Field>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("数値を入力してください");
    expect(screen.getByRole("textbox", { name: "調査した範囲" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("Textarea も見出しで名前が付き、Field の name で送る", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(
      <Form onSubmit={captureSubmit(submitted)}>
        <Field label="感想口コミ本文" name="body" requirement="required">
          <Textarea rows={4} />
        </Field>
        <button type="submit">送信</button>
      </Form>,
    );

    const textarea = screen.getByRole("textbox", { name: "感想口コミ本文" });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toBeRequired();
    await user.type(textarea, "根の張りが良くなった");
    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(submitted[0]?.get("body")).toBe("根の張りが良くなった");
  });

  it("必須の入力が空なら送信を止めてエラーを出す", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(
      <Form onSubmit={captureSubmit(submitted)}>
        <Field label="メールアドレス" name="email" requirement="required">
          <Input type="email" />
        </Field>
        <button type="submit">送信</button>
      </Form>,
    );

    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(submitted).toHaveLength(0);
    const input = screen.getByRole("textbox", { name: "メールアドレス" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveFocus();
  });

  it("ブラウザの検証エラーは閲覧環境の言語によらず日本語で1つだけ出し、alert にはしない", async () => {
    const user = userEvent.setup();
    render(
      <Form onSubmit={captureSubmit([])}>
        <Field label="ニックネーム" name="handle" requirement="required">
          <Input />
        </Field>
        <Field label="パスワード" name="password" requirement="required">
          <Input type="password" />
        </Field>
        <button type="submit">送信</button>
      </Form>,
    );

    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(screen.getAllByText("この項目は必須です。")).toHaveLength(2);
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    const handle = screen.getByRole("textbox", { name: "ニックネーム" });
    expect(handle).toHaveAccessibleDescription("この項目は必須です。");
  });
});
