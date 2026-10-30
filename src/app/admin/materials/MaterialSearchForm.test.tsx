import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter, type UrlUpdateEvent } from "nuqs/adapters/testing";
import { expect, it, vi } from "vitest";

import { MaterialSearchForm } from "./MaterialSearchForm";

it("入力中はURLを変えず、検索と解除を確定したときに反映する", async () => {
  const user = userEvent.setup();
  const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
  render(
    <NuqsTestingAdapter searchParams="?q=トマト" hasMemory onUrlUpdate={onUrlUpdate}>
      <MaterialSearchForm />
    </NuqsTestingAdapter>,
  );
  const input = screen.getByRole("searchbox", { name: "資材名・メーカー名で検索" });
  expect(input).toHaveValue("トマト");
  await user.clear(input);
  await user.type(input, "  いちご  ");
  expect(onUrlUpdate).not.toHaveBeenCalled();
  const form = input.closest("form");

  if (form === null) throw new Error("検索フォームがありません。");
  fireEvent.submit(form);

  await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(1));
  expect(onUrlUpdate.mock.calls[0]?.[0].searchParams.get("q")).toBe("いちご");
  expect(onUrlUpdate.mock.calls[0]?.[0].options).toMatchObject({ shallow: false, history: "push" });
  const updated = screen.getByRole("searchbox", { name: "資材名・メーカー名で検索" });
  expect(updated).toHaveValue("いちご");
  await user.clear(updated);
  const updatedForm = updated.closest("form");

  if (updatedForm === null) throw new Error("検索フォームがありません。");
  fireEvent.submit(updatedForm);

  await waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(2));
  expect(onUrlUpdate.mock.calls[1]?.[0].searchParams.has("q")).toBe(false);
});
