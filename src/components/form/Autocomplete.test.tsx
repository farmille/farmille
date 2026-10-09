import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type FormEvent } from "react";
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
  const [value, setValue] = useState("");
  return (
    <>
      <Autocomplete
        aria-label="所属"
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
  it("矢印キーと Enter で候補を選び、Escape と外側のクリックで閉じる", async () => {
    const user = userEvent.setup();
    const pick = vi.fn();
    render(<Harness onPick={pick} />);
    const input = screen.getByRole("combobox", { name: "所属" });

    await user.type(input, "JA");
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(pick).toHaveBeenCalledWith(affiliations[1]);
    // 選んでも入力中の文字は変えない（変えるかは onPick 側で決める）
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

  it("候補を押しても入力からフォーカスを奪わずに選ぶ", async () => {
    const user = userEvent.setup();
    const pick = vi.fn();
    render(<Harness onPick={pick} />);
    const input = screen.getByRole("combobox", { name: "所属" });

    await user.type(input, "いちご");
    await user.click(screen.getByRole("option", { name: "JAいちご部会" }));

    expect(pick).toHaveBeenCalledWith(affiliations[1]);
    expect(input).toHaveFocus();
  });

  it("説明付きの候補は「ラベル 説明」で読み上げ、onSubmitText が無ければ Enter で囲むフォームを送る", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    function Search() {
      const [value, setValue] = useState("");
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitted.push(new FormData(event.currentTarget));
          }}
        >
          <Autocomplete
            aria-label="資材の検索条件"
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
