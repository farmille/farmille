import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer, type FormEvent } from "react";
import { describe, expect, it, vi } from "vitest";

import { Autocomplete } from "./Autocomplete";
import type { Option } from "./types";

const affiliations: Option[] = [
  { value: "ja-tomato", label: "JAトマト部会" },
  { value: "ja-strawberry", label: "JAいちご部会" },
];

function Harness({
  onPick,
  onSubmitText,
}: {
  onPick: (option: Option) => void;
  onSubmitText?: (text: string) => void;
}) {
  const [value, setValue] = useReducer((_current: string, next: string) => next, "");
  return (
    <>
      <Autocomplete
        hideLabel
        label="所属"
        onPick={onPick}
        onSubmitText={onSubmitText}
        onValueChange={setValue}
        options={affiliations}
        value={value}
      />
      <button type="button">外側</button>
    </>
  );
}

describe("Autocomplete", () => {
  it("一致する候補が無いあいだは一覧を開かず、周りの部品を読み上げから隠さない", async () => {
    const user = userEvent.setup();
    function Host() {
      const [text, setText] = useReducer((_current: string, next: string) => next, "");
      return (
        <>
          <Autocomplete
            hideLabel
            label="所属"
            onValueChange={setText}
            options={[{ value: "ja", label: "JA青年部" }]}
            value={text}
          />
          <button type="button">所属を追加</button>
        </>
      );
    }
    render(<Host />);

    const input = screen.getByRole("combobox", { name: "所属" });
    await user.type(input, "野菜研究サークル");

    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "所属を追加" })).toBeInTheDocument();
  });

  it("open を渡すと、一覧の開閉を呼び出し側が持てる（ボタンで検索した結果を出す）", () => {
    render(
      <Autocomplete
        filterMode="preFiltered"
        hideLabel
        label="資材を検索して追加"
        onValueChange={() => undefined}
        open
        options={[{ value: "m1", label: "土づくり微生物資材", description: "グリーンバイオ" }]}
        value="土づくり"
      />,
    );

    expect(
      screen.getByRole("option", { name: "土づくり微生物資材 グリーンバイオ" }),
    ).toBeInTheDocument();
  });

  it("矢印キーと Enter で候補を選び、Escape と外側のクリックで閉じる", async () => {
    const user = userEvent.setup();
    const pick = vi.fn();
    render(<Harness onPick={pick} />);
    const input = screen.getByRole("combobox", { name: "所属" });

    await user.type(input, "JA");
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(pick).toHaveBeenCalledWith(affiliations[1]);
    expect(input).toHaveValue("JA");
    expect(input).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.keyboard("{ArrowDown}");
    // 一覧を開いているあいだ、外側は読み上げの対象から外れる（aria-hidden）ので文字で探す
    await user.click(screen.getByText("外側"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("変換確定の Enter では選ばず、候補を選んでいない Enter で入力した文字を1回だけ確定する", async () => {
    const user = userEvent.setup();
    const pick = vi.fn();
    const submitText = vi.fn();
    const submitForm = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
    render(
      <form onSubmit={submitForm}>
        <Harness onPick={pick} onSubmitText={submitText} />
      </form>,
    );
    const input = screen.getByRole("combobox", { name: "所属" });

    await user.type(input, "JA");
    await user.keyboard("{ArrowDown}");
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(pick).not.toHaveBeenCalled();
    expect(submitText).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, "地域研究会{Enter}");
    expect(submitText).toHaveBeenCalledOnce();
    expect(submitText).toHaveBeenCalledWith("地域研究会");
    expect(pick).not.toHaveBeenCalled();
    expect(submitForm).not.toHaveBeenCalled();
  });

  it("説明付きの候補は「ラベル 説明」で読み上げ、onSubmitText が無ければ Enter で囲むフォームを送る", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    function Search() {
      const [value, setValue] = useReducer((_current: string, next: string) => next, "");
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitted.push(new FormData(event.currentTarget));
          }}
        >
          <Autocomplete
            hideLabel
            label="資材の検索条件"
            name="q"
            onValueChange={setValue}
            options={[{ value: "tomato", label: "トマト", description: "作物" }]}
            size="search"
            value={value}
          />
          <button type="submit">検索</button>
        </form>
      );
    }
    render(<Search />);
    const input = screen.getByRole("combobox", { name: "資材の検索条件" });

    await user.type(input, "トマ");
    expect(screen.getByRole("option", { name: "トマト 作物" })).toBeInTheDocument();
    await user.keyboard("{Enter}");

    expect(submitted[0]?.get("q")).toBe("トマ");
  });
});
