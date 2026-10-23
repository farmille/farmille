import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type FormEvent } from "react";
import { describe, expect, it, vi } from "vitest";

import { Combobox } from "./Combobox";
import { Form } from "./Form";
import type { Option } from "./types";

const crops: Option[] = [
  { value: "tomato", label: "トマト", description: "なす科果菜類" },
  { value: "strawberry", label: "いちご", description: "ばら科果菜類" },
  { value: "cucumber", label: "きゅうり", description: "うり科果菜類" },
];

function captureSubmit(sink: FormData[]) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sink.push(new FormData(event.currentTarget));
  };
}

describe("Combobox", () => {
  it("label で名前が付き、矢印キーと Enter で選んだ値を name で送る", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(
      <Form persist={false} onSubmit={captureSubmit(submitted)}>
        <Combobox
          emptyMessage="一致する作物がありません"
          label="作目"
          name="cropId"
          options={crops}
          placeholder="作物名を入力"
          requirement="required"
        />
        <button type="submit">送信</button>
      </Form>,
    );

    const input = screen.getByRole("combobox", { name: "作目" });
    expect(input).toBeRequired();
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(input).toHaveValue("いちご");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "送信" }));
    expect(submitted[0]?.get("cropId")).toBe("strawberry");
  });

  it("入力した文字で候補を絞り、候補は「ラベル 説明」の名前で選べる", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(
      <Combobox
        emptyMessage="一致する作物がありません"
        hideLabel
        label="作目"
        onValueChange={change}
        options={crops}
      />,
    );

    await user.type(screen.getByRole("combobox", { name: "作目" }), "トマ");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.click(screen.getByRole("option", { name: "トマト なす科果菜類" }));

    expect(change).toHaveBeenCalledWith(crops[0]);
    expect(screen.getByRole("combobox", { name: "作目" })).toHaveValue("トマト");
  });

  it("変換確定の Enter では候補を選ばず、候補を選んでいない Enter ではフォームを送らない", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const submitted: FormData[] = [];
    render(
      <Form persist={false} onSubmit={captureSubmit(submitted)}>
        <Combobox
          emptyMessage="一致する作物がありません"
          hideLabel
          label="作目"
          name="cropId"
          onValueChange={change}
          options={crops}
        />
      </Form>,
    );

    const input = screen.getByRole("combobox", { name: "作目" });
    await user.click(input);
    await user.keyboard("{ArrowDown}");
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(change).not.toHaveBeenCalled();

    await user.keyboard("{Escape}");
    await user.type(input, "なし{Enter}");
    expect(change).not.toHaveBeenCalled();
    expect(submitted).toHaveLength(0);
  });

  it("必須で未選択なら送信を止める", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(
      <Form persist={false} onSubmit={captureSubmit(submitted)}>
        <Combobox
          emptyMessage="一致する作物がありません"
          label="作目"
          name="cropId"
          options={crops}
          requirement="required"
        />
        <button type="submit">送信</button>
      </Form>,
    );

    await user.click(screen.getByRole("button", { name: "送信" }));

    expect(submitted).toHaveLength(0);
    expect(screen.getByRole("combobox", { name: "作目" })).toHaveAttribute("aria-invalid", "true");
  });

  it("複数選択は選んだ候補をチップで示して値ごとに送り、上限に達すると入力欄を読み取り専用にする", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    render(
      <Form persist={false} onSubmit={captureSubmit(submitted)}>
        <Combobox
          emptyMessage="一致する作物がありません"
          label="栽培作目"
          max={2}
          multiple
          name="cropIds"
          options={crops}
        />
        <button type="submit">送信</button>
      </Form>,
    );

    const input = screen.getByRole("combobox", { name: "栽培作目" });
    await user.click(input);
    await user.click(screen.getByRole("option", { name: "トマト なす科果菜類" }));
    await user.click(input);
    await user.click(screen.getByRole("option", { name: "きゅうり うり科果菜類" }));
    await user.keyboard("{Escape}");

    expect(screen.getByRole("button", { name: "トマトを削除" })).toBeInTheDocument();
    expect(input).toHaveAttribute("readonly");
    await user.click(input);
    expect(screen.getByRole("option", { name: "いちご ばら科果菜類" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "送信" }));
    expect(submitted[0]?.getAll("cropIds")).toEqual(["tomato", "cucumber"]);

    await user.click(screen.getByRole("button", { name: "トマトを削除" }));
    expect(input).not.toHaveAttribute("readonly");
  });

  it("複数選択の空の入力欄では左矢印で最後のチップへ移動できる", async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        defaultValue={[crops[0], crops[2]]}
        emptyMessage="一致する作物がありません"
        label="栽培作目"
        multiple
        options={crops}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "栽培作目" }));
    await user.keyboard("{Escape}{ArrowLeft}");

    expect(screen.getByText("きゅうり", { exact: true })).toHaveFocus();
  });

  it("複数選択の空の入力欄ではBackspaceで最後の選択を外せる", async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        defaultValue={[crops[0], crops[2]]}
        emptyMessage="一致する作物がありません"
        label="栽培作目"
        multiple
        options={crops}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "栽培作目" }));
    await user.keyboard("{Escape}{Backspace}");

    expect(screen.queryByRole("button", { name: "きゅうりを削除" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "トマトを削除" })).toBeInTheDocument();
  });

  it("サーバー検索で候補が入れ替わっても、選んだ候補のラベルを保つ", async () => {
    const user = userEvent.setup();
    function ServerSearch() {
      const [query, setQuery] = useState("");
      const [picked, setPicked] = useState<Option[]>([]);
      return (
        <Combobox
          emptyMessage="一致する作物がありません"
          hideLabel
          label="資材"
          filterMode="preFiltered"
          inputValue={query}
          multiple
          onInputValueChange={setQuery}
          onValueChange={setPicked}
          options={crops.filter((crop) => query !== "" && crop.label.startsWith(query))}
          value={picked}
        />
      );
    }
    render(<ServerSearch />);

    await user.type(screen.getByRole("combobox", { name: "資材" }), "きゅ");
    await user.click(screen.getByRole("option", { name: "きゅうり うり科果菜類" }));

    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "きゅうりを削除" })).toBeInTheDocument();
  });
});
