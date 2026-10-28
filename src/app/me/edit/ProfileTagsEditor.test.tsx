import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProfileTagsEditor } from "./ProfileTagsEditor";
import meta from "./ProfileTagsEditor.stories";

describe("プロフィールのタグ編集", () => {
  it("別名検索と選択・削除をhidden送信値へ反映する", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <ProfileTagsEditor {...meta.args} />
      </form>,
    );
    await user.click(screen.getByRole("button", { name: "いちごを削除" }));
    await user.type(screen.getByRole("combobox", { name: "栽培作目" }), "苺");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(container.querySelector('input[name="cropIds"]')).toHaveValue(
      meta.args.details.crops[0].id,
    );
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
  it("所属の自由入力を確定し、重複を増やさない", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <ProfileTagsEditor {...meta.args} />
      </form>,
    );
    const input = screen.getByRole("combobox", { name: "所属" });
    await user.type(input, "地域農業研究会");
    await user.keyboard("{Enter}");
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    await user.type(input, "地域農業研究会");
    await user.keyboard("{Enter}");
    expect(container.querySelectorAll('input[name="affiliations"]')).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "地域農業研究会を削除" }));
    expect(container.querySelectorAll('input[name="affiliations"]')).toHaveLength(1);
    await user.type(input, "野菜研究サークル");
    await user.click(screen.getByRole("button", { name: "所属を追加" }));
    expect(input).toHaveValue("");
    expect(container.querySelectorAll('input[name="affiliations"]')).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "野菜研究サークルを削除" }));
    expect(container.querySelectorAll('input[name="affiliations"]')).toHaveLength(1);
  });

  it("所属は空欄で候補を出さず、入力と削除に応じて候補を変える", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <ProfileTagsEditor {...meta.args} details={{ ...meta.args.details, affiliations: [] }} />
      </form>,
    );
    const input = screen.getByRole("combobox", { name: "所属" });
    await user.click(input);
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    await user.type(input, "JA");
    expect(screen.getByRole("option", { name: "JA青年部" })).toBeVisible();
    await user.clear(input);
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
    await user.type(input, "JA");
    await user.click(screen.getByRole("option", { name: "JA青年部" }));
    expect(screen.getByRole("button", { name: "JA青年部を削除" })).toBeVisible();
    expect(input).toHaveValue("");
  });
  it("作目50件と所属20件の上限を保つ", () => {
    const crops = Array.from({ length: 50 }, (_, i) => ({
      id: `crop-${i}`,
      name: `作目${i}`,
      aliases: [],
    }));
    render(
      <ProfileTagsEditor
        {...meta.args}
        details={{
          ...meta.args.details,
          crops,
          affiliations: Array.from({ length: 20 }, (_, i) => `所属${i}`),
        }}
      />,
    );
    expect(screen.getByRole("combobox", { name: "栽培作目" })).toHaveAttribute("readonly");
    expect(screen.getByRole("combobox", { name: "所属" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "所属を追加" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
