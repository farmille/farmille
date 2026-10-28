import { renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { useReportLeaveWarning } from "./use-report-leave-warning";

it("閉じたダイアログの警告を外し、ほかの未保存編集の警告を残す", () => {
  const first = renderHook(() => useReportLeaveWarning(true));
  const second = renderHook(() => useReportLeaveWarning(true));
  first.unmount();
  const pending = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(pending);
  expect(pending.defaultPrevented).toBe(true);
  second.unmount();
  const done = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(done);
  expect(done.defaultPrevented).toBe(false);
});
