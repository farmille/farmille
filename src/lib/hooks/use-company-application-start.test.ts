import { act, renderHook, waitFor } from "@testing-library/react";
import { startTransition, StrictMode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import * as actions from "@/app/company-requests/actions";
import { useCompanyApplicationStart } from "./use-company-application-start";

afterEach(() => vi.restoreAllMocks());

it("StrictModeでも入力開始のintentは1回だけ作る", async () => {
  const begin = vi
    .spyOn(actions, "beginApplication")
    .mockResolvedValue({ ok: true, data: "intent-1" });
  const { result } = renderHook(() => useCompanyApplicationStart("registration"), {
    wrapper: StrictMode,
  });
  await waitFor(() => expect(result.current.state).toEqual({ ok: true, data: "intent-1" }));
  expect(begin).toHaveBeenCalledExactlyOnceWith("registration");
});

it("作成に失敗したら再試行できる", async () => {
  const begin = vi
    .spyOn(actions, "beginApplication")
    .mockResolvedValueOnce({ ok: false, error: "internal" })
    .mockResolvedValueOnce({ ok: true, data: "intent-2" });
  const { result } = renderHook(() => useCompanyApplicationStart("transfer_out"));
  await waitFor(() => expect(result.current.state).toEqual({ ok: false, error: "internal" }));
  act(() => startTransition(result.current.begin));
  await waitFor(() => expect(result.current.state).toEqual({ ok: true, data: "intent-2" }));
  expect(begin).toHaveBeenCalledTimes(2);
});
