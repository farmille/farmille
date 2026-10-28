import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Field } from "./Field";
import { Input } from "./Input";

describe("ラベルを内蔵した入力部品", () => {
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
    expect(screen.getByRole("alert")).toHaveTextContent("ニックネームを入力してください。");
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
});
