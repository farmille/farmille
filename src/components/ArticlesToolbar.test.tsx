import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { expect, it, vi } from "vitest";

import { ArticlesToolbar } from "./ArticlesToolbar";

it("検索の確定時にURLを更新し、種別を保ってページ番号を消す", async () => {
  const user = userEvent.setup();
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  render(
    <NuqsTestingAdapter
      hasMemory
      onUrlUpdate={onUrlUpdate}
      searchParams="?type=article&q=トマト&page=3"
    >
      <ArticlesToolbar />
    </NuqsTestingAdapter>,
  );
  const input = screen.getByRole("searchbox", { name: "記事を検索" });
  expect(input).toHaveValue("トマト");
  expect(screen.getByRole("link", { name: "記事" })).toHaveAttribute("aria-current", "page");

  await user.clear(input);
  await user.type(input, "  いちご  ");
  expect(onUrlUpdate).not.toHaveBeenCalled();
  const search = input.closest("form");

  if (search === null) throw new Error("検索フォームがありません。");
  fireEvent.submit(search);

  await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(1));
  const params = onUrlUpdate.mock.calls[0]?.[0].searchParams;
  expect(params?.get("q")).toBe("いちご");
  expect(params?.get("type")).toBe("article");
  expect(params?.has("page")).toBe(false);
  expect(screen.getByRole("searchbox", { name: "記事を検索" })).toHaveValue("いちご");
  const href = screen.getByRole("link", { name: "実証詳細レポート" }).getAttribute("href");
  const linked = new URLSearchParams(href?.split("?")[1]);
  expect(linked.get("type")).toBe("report");
  expect(linked.get("q")).toBe("いちご");
  expect(linked.has("page")).toBe(false);
});
