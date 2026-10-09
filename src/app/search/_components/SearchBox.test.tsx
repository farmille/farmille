import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchBox } from "./SearchBox";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactElement, ReactNode } from "react";

const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  bfcacheId: "test",
} satisfies AppRouterInstance;
function renderSearch(element: ReactElement) {
  return render(element, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AppRouterContext.Provider value={router}>{children}</AppRouterContext.Provider>
    ),
  });
}
const props = {
  initialQuery: "",
  selected: [],
  sort: "reviews" as const,
  catalog: { filters: [], makers: [], materials: [{ name: "トマト資材", aliases: [] }] },
};
const advanceSearch = () => act(() => vi.advanceTimersByTime(300));

describe("資材の入力検索", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("入力が落ち着いたらURLを更新し、検索結果を取得する", async () => {
    renderSearch(<SearchBox {...props} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "トマト" } });
    expect(router.replace).not.toHaveBeenCalled();
    await advanceSearch();
    expect(router.replace).toHaveBeenCalledWith(`/search?q=${encodeURIComponent("トマト")}`, {
      scroll: false,
    });
  });
  it("日本語変換の途中では検索しない", async () => {
    renderSearch(<SearchBox {...props} />);
    const input = screen.getByRole("textbox");
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "とまと" } });
    await advanceSearch();
    expect(router.replace).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    await advanceSearch();
    expect(router.replace).toHaveBeenCalledTimes(1);
  });
  it("遅れて届いた結果で新しい入力やフォーカスを失わない", async () => {
    const view = renderSearch(<SearchBox {...props} />);
    const input = screen.getByRole("textbox");
    input.focus();
    fireEvent.change(input, { target: { value: "トマ" } });
    await advanceSearch();
    fireEvent.change(input, { target: { value: "トマト" } });
    view.rerender(<SearchBox {...props} initialQuery="トマ" />);
    expect(input).toHaveValue("トマト");
    expect(input).toHaveFocus();
    await advanceSearch();
    expect(router.replace).toHaveBeenLastCalledWith(`/search?q=${encodeURIComponent("トマト")}`, {
      scroll: false,
    });
  });
  it("別のURLの検索条件を入力欄にも反映する", () => {
    const view = renderSearch(<SearchBox {...props} initialQuery="トマト" />);
    view.rerender(<SearchBox {...props} initialQuery="いちご" />);
    expect(screen.getByRole("textbox")).toHaveValue("いちご");
    view.rerender(<SearchBox {...props} />);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });
  it("読みや別名で一致した候補を表示製品名として選べる", () => {
    renderSearch(
      <SearchBox
        {...props}
        initialQuery="ぜば"
        catalog={{ filters: [], makers: [], materials: [{ name: "ZEBA", aliases: ["ゼバ"] }] }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "製品名 ZEBA" }));
    expect(router.push.mock.calls[0][0]).toContain("filters=name%3AZEBA");
  });
  it("候補選択はキーワードを消して確定した条件に置き換える", () => {
    renderSearch(<SearchBox {...props} initialQuery="トマト" />);
    fireEvent.click(screen.getByRole("button", { name: "製品名 トマト資材" }));
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(router.push).toHaveBeenCalled();
    expect(router.push.mock.calls[0][0]).not.toContain("q=");
  });
});
