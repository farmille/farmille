import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { ReportImageEditor } from "./ReportImageEditor";

it("切り取り中は離脱を警告し、取消後は未変更の画像として扱う", () => {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 420;
  render(
    <ReportImageEditor
      open
      original={canvas}
      current={canvas}
      onDone={() => {}}
      onCancel={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "切り取り" }));
  const editing = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(editing);
  expect(editing.defaultPrevented).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "やめる" }));
  const canceled = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(canceled);
  expect(canceled.defaultPrevented).toBe(false);
});
