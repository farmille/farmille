import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "./Combobox";

const options = [
  { value: "tomato", label: "トマト" },
  { value: "strawberry", label: "いちご" },
];
function Harness({
  onSelect,
  onSubmitValue,
}: {
  onSelect: (id: string) => void;
  onSubmitValue?: () => void;
}) {
  const [value, setValue] = useState("");
  return (
    <>
      <Combobox
        id="crop"
        aria-label="作目"
        value={value}
        onValueChange={setValue}
        options={options}
        onSelect={onSelect}
        onSubmitValue={onSubmitValue}
      />
      <button type="button">外側</button>
    </>
  );
}

describe("コンボボックス", () => {
  it("矢印キーとEnterで候補を選び、Escapeと外側クリックで閉じる", async () => {
    const user = userEvent.setup();
    const select = vi.fn();
    render(<Harness onSelect={select} />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(select).toHaveBeenCalledWith("strawberry");
    expect(input).toHaveAttribute("aria-expanded", "false");
    await user.click(input);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.click(input);
    await user.click(screen.getByRole("button", { name: "外側" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
  it("変換中のEnterでは選択せず、自由入力を確定できる", async () => {
    const user = userEvent.setup();
    const select = vi.fn();
    const submit = vi.fn();
    render(<Harness onSelect={select} onSubmitValue={submit} />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}");
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(select).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
    await user.type(input, "地域研究会");
    await user.keyboard("{Enter}");
    expect(submit).toHaveBeenCalledOnce();
    expect(select).not.toHaveBeenCalled();
  });
  it("検索前の空パネルは隠し、候補が届いたら開く", async () => {
    const user = userEvent.setup();
    const select = vi.fn();
    const change = vi.fn();
    const { rerender } = render(
      <Combobox
        id="material"
        aria-label="資材"
        value="土づくり"
        options={[]}
        onValueChange={change}
        onSelect={select}
        showEmptyState={false}
      />,
    );
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    rerender(
      <Combobox
        id="material"
        aria-label="資材"
        value="土づくり"
        options={options}
        onValueChange={change}
        onSelect={select}
        showEmptyState={false}
      />,
    );
    expect(screen.getByRole("listbox")).toBeVisible();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(select).toHaveBeenCalledWith("tomato");
  });
  it("候補をクリックしても入力からフォーカスを奪わず選択する", async () => {
    const user = userEvent.setup();
    const select = vi.fn();
    render(<Harness onSelect={select} />);
    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.click(screen.getByRole("option", { name: "トマト" }));
    expect(select).toHaveBeenCalledWith("tomato");
    expect(input).toHaveFocus();
  });
});
