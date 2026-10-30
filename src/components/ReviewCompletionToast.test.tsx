import { render, screen, waitFor } from "@testing-library/react";
import { NuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { expect, it, vi } from "vitest";
import { ReviewCompletionToast } from "./ReviewCompletionToast";
import { Toaster } from "./Toaster";

it("通知後はほかの検索条件を残し、履歴を増やさず完了印だけ外す", async () => {
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  render(
    <NuqsTestingAdapter searchParams="?review=posted&q=トマト" hasMemory onUrlUpdate={onUrlUpdate}>
      <ReviewCompletionToast />
      <Toaster />
    </NuqsTestingAdapter>,
  );
  expect(await screen.findByText("感想口コミを投稿しました。")).toBeVisible();
  await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(1));
  const update = onUrlUpdate.mock.calls[0]?.[0];
  expect(update?.searchParams.has("review")).toBe(false);
  expect(update?.searchParams.get("q")).toBe("トマト");
  expect(update?.options).toMatchObject({ shallow: true, history: "replace" });
});
