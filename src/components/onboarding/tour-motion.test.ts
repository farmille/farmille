import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { fixedPostBarHeight, useBottomSpace } from "./tour-motion";

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

describe("案内の置き場所", () => {
  it("案内を出した後に投稿のバーが描かれても、バーの上へ持ち上げる", async () => {
    const { result } = renderHook(() => useBottomSpace<HTMLDivElement>());
    expect(result.current.clear).toBe("0px");

    act(() => addPostBar("fixed", window.innerHeight - 76));

    await waitFor(() => expect(result.current.clear).toBe("76px"));
  });
});
