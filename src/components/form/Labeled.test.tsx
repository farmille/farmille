import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Autocomplete } from "./Autocomplete";
import { CheckboxGroup } from "./CheckboxGroup";
import { Combobox } from "./Combobox";
import { Field } from "./Field";
import { Fieldset } from "./Fieldset";
import { FileInput } from "./FileInput";
import { Input } from "./Input";
import { OtpInput } from "./OtpInput";
import { RadioGroup } from "./RadioGroup";
import { Select } from "./Select";
import { Textarea } from "./Textarea";

const options = [
  { value: "tomato", label: "トマト" },
  { value: "cucumber", label: "きゅうり" },
];

describe("ラベルを内蔵した入力部品", () => {
  it("label が入力欄の名前になり、requirement が必須を決める", () => {
    render(<Input label="ニックネーム" requirement="required" />);

    const input = screen.getByRole("textbox", { name: "ニックネーム" });
    expect(input).toBeRequired();
  });

  it("hideLabel でも名前は残る", () => {
    render(<Input hideLabel label="姓" />);

    expect(screen.getByRole("textbox", { name: "姓" })).toBeInTheDocument();
  });

  it("案内・公開範囲・エラーを入力欄の説明に結びつける", () => {
    render(
      <Input
        description="本名でなくて構いません。"
        error="ニックネームを入力してください。"
        label="ニックネーム"
        lead="投稿に表示されます"
        visibility="private"
      />,
    );

    const input = screen.getByRole("textbox", { name: "ニックネーム" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      /^(?=.*公開されません)(?=.*投稿に表示されます)(?=.*本名でなくて構いません。)(?=.*ニックネームを入力してください。)/,
    );
  });

  it("枠の className は fieldClassName で渡し、本体の className とは別になる", () => {
    render(<Input className="control" fieldClassName="frame" label="ニックネーム" />);

    const input = screen.getByRole("textbox", { name: "ニックネーム" });
    expect(input).toHaveClass("control");
    expect(input.closest(".frame")).not.toBeNull();
  });

  it("入力欄ごとに label が名前になる", () => {
    render(
      <>
        <Textarea label="感想" />
        <Select label="作目" options={options} />
        <Combobox emptyMessage="候補がありません" label="栽培作目" options={options} />
        <Autocomplete label="資材" onValueChange={() => {}} options={options} value="" />
        <OtpInput label="認証コード" />
        <FileInput label="確認資料" />
      </>,
    );

    expect(screen.getByRole("textbox", { name: "感想" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "作目" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "栽培作目" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "資材" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "認証コード" })).toBeInTheDocument();
    expect(screen.getByLabelText("確認資料", { exact: false })).toHaveAttribute("type", "file");
  });

  it("選択肢の組は label が組の名前（legend）になる", () => {
    render(
      <>
        <CheckboxGroup label="使用時期" options={options} />
        <RadioGroup label="栽培形態" options={options} />
      </>,
    );

    expect(screen.getByRole("group", { name: "使用時期" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "栽培形態" })).toBeInTheDocument();
  });
});

describe("Field・Fieldset の中の入力部品", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // render 中の例外を React が console.error に出すので、テストの出力から外す
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("label={null} の部品は、囲む Field の見出しが名前になる", () => {
    render(
      <Field label="調査した範囲" requirement="required">
        <Input label={null} />
      </Field>,
    );

    expect(screen.getByRole("textbox", { name: "調査した範囲" })).toBeRequired();
  });

  it("label={null} の組は、name 付きの Fieldset の見出しが名前になる", () => {
    render(
      <Fieldset legend="申請内容" name="target" requirement="required">
        <RadioGroup label={null} options={options} />
      </Fieldset>,
    );

    expect(screen.getByRole("group", { name: "申請内容" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-required", "true");
  });

  it("囲む Field が無いところの label={null} は、名前の無い入力欄になるので作れない", () => {
    expect(() => render(<Input label={null} />)).toThrow("label={null}");
  });

  it("Field の中の部品に label を付けると、見出しが二重になるので作れない", () => {
    expect(() =>
      render(
        <Field label="ニックネーム">
          <Input label="ニックネーム" />
        </Field>,
      ),
    ).toThrow("Field の中の部品に label は付けられません");
  });

  it("Fieldset の中には label 付きの部品を置ける", () => {
    render(
      <Fieldset legend="本名" requirement="required">
        <Input hideLabel label="姓" />
        <Input hideLabel label="名" />
      </Fieldset>,
    );

    expect(screen.getByRole("group", { name: "本名" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "姓" })).toBeRequired();
    expect(screen.getByRole("textbox", { name: "名" })).toBeRequired();
  });
});
