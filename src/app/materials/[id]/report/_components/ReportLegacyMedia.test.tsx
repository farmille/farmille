import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReportLegacyMedia } from "./ReportLegacyMedia";
import { reportLegacyMedia } from "./report-page-state";
import { legacyMediaReport } from "./reportStoryFixture";

describe("以前の形式の写真", () => {
  it("調査項目に属さない写真だけを、添えた欄と一緒に出し、削除できる", () => {
    const media = reportLegacyMedia(legacyMediaReport);
    expect(media.map((item) => item.section)).toEqual(["results", "documents"]);
    const onRemove = vi.fn();
    render(<ReportLegacyMedia media={media} onRemove={onRemove} />);
    expect(screen.getByRole("heading", { name: "以前の形式の写真" })).toBeInTheDocument();
    expect(screen.getByText("添えた欄：結果・感想")).toBeInTheDocument();
    expect(screen.getByText("添えた欄：関連資料")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "使用区の株（7月20日）を削除" }));
    expect(onRemove).toHaveBeenCalledWith(media[0]?.id);
  });
});
