import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useQueryStates } from "nuqs";
import { NuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import type { ReactElement, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { materialSearchParsers } from "@/lib/search-query-state";
import { SearchBox } from "./SearchBox";

const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();

function renderSearch(element: ReactElement) {
  return render(element, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <NuqsTestingAdapter hasMemory onUrlUpdate={onUrlUpdate}>
        {children}
      </NuqsTestingAdapter>
    ),
  });
}

const props = {
  initialQuery: "",
  selected: [],
  sort: "reviews" as const,
  catalog: { filters: [], makers: [], materials: [{ name: "トマト資材", aliases: [] }] },
};

function OtherUrlChanges() {
  const [, setSearch] = useQueryStates(materialSearchParsers);

  return (
    <>
      <button type="button" onClick={() => void setSearch({ sort: "newest" })}>
        新着順
      </button>
      <button type="button" onClick={() => void setSearch({ q: "いちご" })}>
        戻る
      </button>
    </>
  );
}

const advanceSearch = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(301);
  });

const searchInput = () => screen.getByRole("combobox", { name: "資材の検索条件" });

function pickOption(name: string) {
  fireEvent.keyDown(searchInput(), { key: "ArrowDown" });
  fireEvent.click(screen.getByRole("option", { name }));
}

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
    fireEvent.change(searchInput(), { target: { value: "トマト" } });
    expect(onUrlUpdate).not.toHaveBeenCalled();
    await advanceSearch();
    expect(onUrlUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        queryString: "?q=トマト",
        options: expect.objectContaining({ history: "replace", shallow: false, scroll: false }),
      }),
    );
  });
  it("入力を待つ間に変えた並び順を戻さない", async () => {
    renderSearch(
      <>
        <SearchBox {...props} />
        <OtherUrlChanges />
      </>,
    );
    fireEvent.change(searchInput(), { target: { value: "トマト" } });
    fireEvent.click(screen.getByRole("button", { name: "新着順" }));
    await advanceSearch();
    expect(onUrlUpdate.mock.lastCall?.[0].queryString).toBe("?sort=newest&q=トマト");
  });
  it("入力を待つ間に別の検索語へ移ったら、古い入力を送らない", async () => {
    renderSearch(
      <>
        <SearchBox {...props} />
        <OtherUrlChanges />
      </>,
    );
    fireEvent.change(searchInput(), { target: { value: "トマト" } });
    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    await advanceSearch();
    expect(onUrlUpdate.mock.lastCall?.[0].queryString).toBe("?q=いちご");
  });
  it("応答を待つ間に元の検索語へ戻した入力も送る", async () => {
    renderSearch(<SearchBox {...props} initialQuery="トマト" />);
    fireEvent.change(searchInput(), { target: { value: "いちご" } });
    await advanceSearch();
    fireEvent.change(searchInput(), { target: { value: "トマト" } });
    await advanceSearch();
    expect(onUrlUpdate.mock.lastCall?.[0].queryString).toBe("?q=トマト");
  });
  it("日本語変換の途中では検索しない", async () => {
    renderSearch(<SearchBox {...props} />);
    const input = searchInput();
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "とまと" } });
    await advanceSearch();
    expect(onUrlUpdate).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    await advanceSearch();
    expect(onUrlUpdate).toHaveBeenCalledTimes(1);
  });
  it("遅れて届いた結果で新しい入力やフォーカスを失わない", async () => {
    const view = renderSearch(<SearchBox {...props} />);
    const input = searchInput();
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "トマ" } });
    await advanceSearch();
    fireEvent.change(input, { target: { value: "トマト" } });
    view.rerender(<SearchBox {...props} initialQuery="トマ" />);
    expect(input).toHaveValue("トマト");
    expect(input).toHaveFocus();
    await advanceSearch();
    expect(onUrlUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        queryString: "?q=トマト",
        options: expect.objectContaining({ history: "replace", shallow: false, scroll: false }),
      }),
    );
  });
  it("別のURLの検索条件を入力欄にも反映する", () => {
    const view = renderSearch(<SearchBox {...props} initialQuery="トマト" />);
    view.rerender(<SearchBox {...props} initialQuery="いちご" />);
    expect(searchInput()).toHaveValue("いちご");
    view.rerender(<SearchBox {...props} />);
    expect(searchInput()).toHaveValue("");
  });

  it("候補選択はキーワードを消して確定した条件に置き換える", async () => {
    renderSearch(
      <SearchBox
        {...props}
        initialQuery="ぜば"
        catalog={{ filters: [], makers: [], materials: [{ name: "ZEBA", aliases: ["ゼバ"] }] }}
      />,
    );
    pickOption("ZEBA 製品名");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(onUrlUpdate.mock.calls[0][0].queryString).toContain("filters=name:ZEBA");
    expect(searchInput()).toHaveValue("");
    expect(onUrlUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ options: expect.objectContaining({ history: "push" }) }),
    );
    expect(onUrlUpdate.mock.calls[0][0].queryString).not.toContain("q=");
  });
  it("候補を選ばない Enter は待たずに検索し、変換確定の Enter では検索しない", async () => {
    renderSearch(<SearchBox {...props} />);
    const input = searchInput();
    fireEvent.change(input, { target: { value: "トマト" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(onUrlUpdate).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(onUrlUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        queryString: "?q=トマト",
        options: expect.objectContaining({ history: "push", shallow: false, scroll: false }),
      }),
    );
    expect(onUrlUpdate).toHaveBeenCalledTimes(1);
  });
});
