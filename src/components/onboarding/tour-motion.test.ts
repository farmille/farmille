import { afterEach, describe, expect, it } from "vitest";

import { fixedPostBarHeight } from "./tour-motion";

afterEach(() => {
  document.body.replaceChildren();
});

function addPostBar(position: string, top: number): void {
  const bar = document.createElement("div");
  bar.dataset.ui = "responsive-fab-bar";
  bar.style.position = position;
  bar.getBoundingClientRect = () => new DOMRect(0, top, 300, window.innerHeight - top);
  document.body.append(bar);
}

describe("案内が避ける、画面の下の投稿のバー", () => {
  it("バーが無い画面では高さを 0 にする", () => {
    expect(fixedPostBarHeight()).toBe(0);
  });

  it("画面の下に固定されたバーは、上端から画面の下までの高さを返す", () => {
    addPostBar("fixed", window.innerHeight - 76);
    expect(fixedPostBarHeight()).toBe(76);
  });

  it("画面に固定されていないバーは避けない", () => {
    addPostBar("static", window.innerHeight - 76);
    expect(fixedPostBarHeight()).toBe(0);
  });
});
