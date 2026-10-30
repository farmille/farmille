import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { expect, it, vi } from "vitest";

import { ReviewSortSelect } from "./ReviewSortSelect";

it("サーバーの応答前に選択表示を更新し、並び替え時はページ番号を消す", async () => {
  const user = userEvent.setup();
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  render(
    <NuqsTestingAdapter searchParams="?sort=newest&page=3" onUrlUpdate={onUrlUpdate} hasMemory>
      <ReviewSortSelect />
    </NuqsTestingAdapter>,
  );
  const sort = screen.getByRole("combobox", { name: "感想口コミの並び替え" });
  await user.click(sort);
  await user.click(await screen.findByRole("option", { name: "参考になった順" }));
  await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
  expect(onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.get("sort")).toBe("helpful");
  expect(onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.has("page")).toBe(false);
  expect(sort).toHaveTextContent("参考になった順");
  await user.click(sort);
  await user.click(await screen.findByRole("option", { name: "新着順" }));
  await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(2));
  expect(onUrlUpdate.mock.calls.at(-1)?.[0].searchParams.has("sort")).toBe(false);
  expect(sort).toHaveTextContent("新着順");
});
