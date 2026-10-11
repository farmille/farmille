import { render, screen } from "@testing-library/react";
import Link from "next/link";
import userEvent from "@testing-library/user-event";
import type { FormEvent } from "react";
import { describe, expect, it } from "vitest";

import { Checkbox } from "./Checkbox";
import { Field } from "./Field";
import { Form } from "./Form";

function captureSubmit(sink: FormData[]) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sink.push(new FormData(event.currentTarget));
  };
}

function Terms() {
  return (
    <Checkbox variant="row">
      <Link href="/legal/terms">総合利用規約</Link>・
      <Link href="/legal/posting">投稿ガイドライン</Link>
      に同意する
    </Checkbox>
  );
}

describe("Checkbox", () => {
  it("枠付きの行の説明は、名前に入れず説明として読ませる", () => {
    render(
      <Field name="varietyUnknown">
        <Checkbox description="チェックすると品種の記入は不要です" variant="row">
          品種が不明、または品種がない
        </Checkbox>
      </Field>,
    );

    expect(
      screen.getByRole("checkbox", { name: "品種が不明、または品種がない" }),
    ).toHaveAccessibleDescription("チェックすると品種の記入は不要です");
  });

  it("包んだ文で名前が付き、必須の札は名前に入れず aria-required で伝える", () => {
    render(
      <Field name="terms" requirement="required">
        <Terms />
      </Field>,
    );

    const checkbox = screen.getByRole("checkbox", { name: /利用規約.*に同意する/ });
    expect(checkbox).not.toHaveAccessibleName(/必須/);
    expect(checkbox).toHaveAttribute("aria-required", "true");
    expect(screen.getByText("必須")).toBeInTheDocument();
    expect(screen.getAllByLabelText(/投稿ガイドライン/)).toEqual([checkbox]);
  });

  it("文を押すと1回だけ切り替わる", async () => {
    const user = userEvent.setup();
    render(
      <Field name="terms" requirement="required">
        <Terms />
      </Field>,
    );

    const checkbox = screen.getByRole("checkbox", { name: /利用規約/ });
    await user.click(screen.getByText("に同意する", { exact: false }));
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("チェックすると Field の name で on を送る", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(
      <Form onSubmit={captureSubmit(submitted)}>
        <Field name="terms" requirement="required">
          <Terms />
        </Field>
        <button type="submit">登録する</button>
      </Form>,
    );

    await user.click(screen.getByRole("button", { name: "登録する" }));
    expect(submitted).toHaveLength(0);

    await user.click(screen.getByRole("checkbox", { name: /利用規約/ }));
    await user.click(screen.getByRole("button", { name: "登録する" }));
    expect(submitted[0]?.get("terms")).toBe("on");
  });

  it("Field の外でも name と value で送る", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(
      <Form onSubmit={captureSubmit(submitted)}>
        <Checkbox defaultChecked name="removePhoto" value="photo-1">
          この写真を削除する
        </Checkbox>
        <button type="submit">保存</button>
      </Form>,
    );

    expect(screen.getByRole("checkbox", { name: "この写真を削除する" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "保存" }));
    expect(submitted[0]?.getAll("removePhoto")).toEqual(["photo-1"]);
  });
});
