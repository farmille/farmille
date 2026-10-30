import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { expect, it, vi } from "vitest";

import { MaterialPicker } from "./MaterialPicker";

it("検索を確定すると投稿種別を保ってURLを更新し、選択を解除する", async () => {
  const user = userEvent.setup();
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  render(
    <NuqsTestingAdapter searchParams="?q=トマト&type=report" hasMemory onUrlUpdate={onUrlUpdate}>
      <MaterialPicker
        postType="report"
        materials={[
          {
            id: "material-1",
            name: "微生物資材",
            manufacturer_name: "ファーム技研",
            review_count: 0,
            avg_rating: null,
            manufacturer_verified_at: null,
            imageUrl: null,
          },
        ]}
      />
    </NuqsTestingAdapter>,
  );
  const input = screen.getByRole("searchbox", { name: "資材名・メーカー名で検索" });
  expect(input).toHaveValue("トマト");
  await user.click(screen.getByRole("button", { name: "微生物資材を選択" }));
  expect(screen.getByRole("button", { name: "微生物資材を選択" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await user.clear(input);
  await user.type(input, "  いちご  ");
  expect(onUrlUpdate).not.toHaveBeenCalled();
  fireEvent.submit(screen.getByRole("search"));

  await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(1));
  const params = onUrlUpdate.mock.calls[0]?.[0].searchParams;
  expect(params?.get("q")).toBe("いちご");
  expect(params?.get("type")).toBe("report");
  expect(onUrlUpdate.mock.calls[0]?.[0].options).toMatchObject({ shallow: false, history: "push" });
  expect(screen.getByRole("searchbox", { name: "資材名・メーカー名で検索" })).toHaveValue("いちご");
  expect(screen.getByRole("button", { name: "微生物資材を選択" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await user.click(screen.getByRole("button", { name: "微生物資材を選択" }));
  fireEvent.submit(screen.getByRole("search"));
  expect(screen.getByRole("button", { name: "微生物資材を選択" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});
