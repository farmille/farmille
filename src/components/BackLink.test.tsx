import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

import { BackLink } from "./BackLink";

const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  bfcacheId: "test",
} satisfies AppRouterInstance;

/** Navigation API の履歴を、古い順のパスと今いる位置で置き換える。 */
function stubHistory(paths: string[], currentIndex = paths.length - 1) {
  vi.stubGlobal("navigation", {
    currentEntry: { index: currentIndex },
    entries: () => paths.map((path) => ({ url: `https://farmille.test${path}` })),
  });
}

function renderBackLink() {
  render(
    <AppRouterContext.Provider value={router}>
      <BackLink className="" href="/search">
        戻る
      </BackLink>
    </AppRouterContext.Provider>,
  );

  return screen.getByRole("link", { name: "戻る" });
}

describe("BackLink", () => {
  let go: MockInstance<History["go"]>;
  beforeEach(() => {
    vi.clearAllMocks();
    go = vi.spyOn(window.history, "go").mockImplementation(() => {});
  });
  afterEach(() => {
    cleanup();
    go.mockRestore();
    vi.unstubAllGlobals();
  });

  it("このサイトの画面から来たときは、ブラウザの履歴で1つ前の画面へ戻る", () => {
    stubHistory(["/search", "/materials/1"]);
    const link = renderBackLink();

    const followed = fireEvent.click(link);

    expect(go).toHaveBeenCalledWith(-1);
    expect(followed).toBe(false);
  });

  it("投稿の後は、投稿画面と同じ資材ページを飛ばして、その前の画面へ戻る", () => {
    stubHistory(["/search", "/materials/1", "/materials/1/review/new", "/materials/1"]);
    const link = renderBackLink();

    fireEvent.click(link);

    expect(go).toHaveBeenCalledWith(-3);
  });

  it("ログインを挟んで開いた画面からは、ログイン画面を飛ばしてその前の画面へ戻る", () => {
    stubHistory(["/materials/1", "/login", "/materials/1/review/new"]);
    const link = renderBackLink();

    fireEvent.click(link);

    expect(go).toHaveBeenCalledWith(-2);
  });

  it("前に認証の画面しか無いときは、履歴を使わず戻り先のリンクをたどる", () => {
    stubHistory(["/signup/complete", "/login", "/me"]);
    const link = renderBackLink();

    const followed = fireEvent.click(link);

    expect(go).not.toHaveBeenCalled();
    expect(followed).toBe(true);
  });

  it("入力画面からは、親の画面へ1つ戻る", () => {
    stubHistory(["/search", "/materials/1", "/materials/1/review/new"]);
    const link = renderBackLink();

    fireEvent.click(link);

    expect(go).toHaveBeenCalledWith(-1);
  });

  it("名前が前方だけ同じ別の画面は飛ばさない", () => {
    stubHistory(["/materials/10", "/materials/1"]);
    const link = renderBackLink();

    fireEvent.click(link);

    expect(go).toHaveBeenCalledWith(-1);
  });

  it("前にこの画面と配下の画面しか無いときは、履歴を使わず戻り先のリンクをたどる", () => {
    stubHistory(["/materials/1/review/new", "/materials/1"]);
    const link = renderBackLink();

    expect(link).toHaveAttribute("href", "/search");
    const followed = fireEvent.click(link);

    expect(go).not.toHaveBeenCalled();
    expect(followed).toBe(true);
  });

  it("外部から来た・直接開いたときは、履歴を使わず戻り先のリンクをたどる", () => {
    stubHistory(["/materials/1"]);
    const link = renderBackLink();

    fireEvent.click(link);

    expect(go).not.toHaveBeenCalled();
  });

  it("Navigation API の無いブラウザでは、戻り先のリンクをたどる", () => {
    vi.stubGlobal("navigation", undefined);
    const link = renderBackLink();

    fireEvent.click(link);

    expect(go).not.toHaveBeenCalled();
  });

  it("新しいタブで開く操作では、履歴で戻らない", () => {
    stubHistory(["/search", "/materials/1"]);
    const link = renderBackLink();

    fireEvent.click(link, { metaKey: true });

    expect(go).not.toHaveBeenCalled();
  });
});
