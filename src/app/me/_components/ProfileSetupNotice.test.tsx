import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { missingProfileItems, ProfileSetupNotice } from "./ProfileSetupNotice";

describe("未設定の項目の案内", () => {
  it("空の項目だけを編集画面の並び順で返す", () => {
    expect(
      missingProfileItems({ bio: "  ", crops: [], affiliations: ["4Hクラブ"], links: [] }),
    ).toEqual(["bio", "crops", "links"]);
  });

  it("空の項目をボタンで並べ、プロフィール公開情報編集へ進める", () => {
    render(<ProfileSetupNotice missing={["links", "crops", "bio"]} />);
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["自己紹介", "栽培作目", "リンク"]);
    expect(links.every((link) => link.getAttribute("href") === "/me/edit")).toBe(true);
  });

  it("全部そろっていれば何も出さない", () => {
    expect(
      missingProfileItems({
        bio: "露地でレタスを作っています。",
        crops: [1],
        affiliations: [1],
        links: [1],
      }),
    ).toEqual([]);
    const { container } = render(<ProfileSetupNotice missing={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
