import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { FileInput } from "./FileInput";

describe("FileInput", () => {
  it("選択したファイル名を日本語の状態表示へ反映する", async () => {
    const user = userEvent.setup();
    render(createElement(FileInput, { "aria-label": "画像ファイル", multiple: true }));

    const input = screen.getByLabelText("画像ファイル");
    const files = [
      new File(["first"], "圃場写真.jpg", { type: "image/jpeg" }),
      new File(["second"], "比較写真.png", { type: "image/png" }),
    ];

    expect(screen.getByText("ファイルが選択されていません")).toBeInTheDocument();
    await user.upload(input, files);
    expect(screen.getByText("2件選択中：圃場写真.jpg、比較写真.png")).toBeInTheDocument();
  });

  it("フォームのリセットに合わせて選択状態を戻す", async () => {
    const user = userEvent.setup();
    render(
      createElement(
        "form",
        { "aria-label": "画像フォーム" },
        createElement(FileInput, { "aria-label": "画像ファイル", name: "image" }),
      ),
    );

    await user.upload(
      screen.getByLabelText("画像ファイル"),
      new File(["image"], "選択済み.webp", { type: "image/webp" }),
    );
    expect(screen.getByText("選択中：選択済み.webp")).toBeInTheDocument();

    fireEvent.reset(screen.getByRole("form", { name: "画像フォーム" }));
    expect(screen.getByText("ファイルが選択されていません")).toBeInTheDocument();
  });

  it("呼び出し側が入力を空にした場合は未選択表示へ戻す", async () => {
    const user = userEvent.setup();
    render(
      createElement(FileInput, {
        "aria-label": "画像ファイル",
        onChange: (event) => {
          event.currentTarget.value = "";
        },
      }),
    );

    await user.upload(
      screen.getByLabelText("画像ファイル"),
      new File(["image"], "処理済み.jpg", { type: "image/jpeg" }),
    );
    expect(screen.getByText("ファイルが選択されていません")).toBeInTheDocument();
  });
});
