import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { saveUsageReportDraftAction } from "@/app/materials/[id]/report/new/actions";
import { createBlankUsageReport } from "@/lib/usage-report";
import { ReportForm } from "./ReportForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock("@/lib/auth/browser", () => ({ createAuthBrowserClient: vi.fn() }));
vi.mock("@/app/materials/[id]/report/new/actions", () => ({
  saveUsageReportDraftAction: vi.fn(),
  submitUsageReportAction: vi.fn(),
  searchReportMaterialsAction: vi.fn(),
}));

describe("レポート下書きの部分保存", () => {
  it("補足の保存失敗後も離脱を確認し、更新日時を引き継いで再保存する", async () => {
    const draft = createBlankUsageReport("00000000-0000-4000-8000-000000000101");
    const updatedAt = "2026-10-09T00:00:00.000Z";
    vi.mocked(saveUsageReportDraftAction)
      .mockResolvedValueOnce({ ok: false, message: "使用目的の補足を保存できませんでした。", fieldErrors: {}, savedUpdatedAt: updatedAt })
      .mockResolvedValueOnce({ ok: true, status: "draft", reportId: draft.reportId, updatedAt, message: "下書きを保存しました。" });
    render(<ReportForm material={{ id: draft.materialId, name: "資材", manufacturerName: "メーカー", imageUrl: null }} userId="user" crops={[]} effects={[]} materialEffectNames={[]} favoriteCropIds={[]} materialCropIds={[]} draft={draft} registeredAddress={{ prefectureCode: 45, city: "宮崎市" }} />);
    fireEvent.click(screen.getByRole("button", { name: "2 結果" }));
    fireEvent.change(screen.getByLabelText("使用目的の補足（任意）"), { target: { value: "樹勢を維持したかった" } });
    fireEvent.click(screen.getByRole("button", { name: "下書き保存", exact: true }));
    await screen.findByText("使用目的の補足を保存できませんでした。");
    const unload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(unload);
    expect(unload.defaultPrevented).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "レポートを閉じる" }));
    expect(screen.getByText("入力途中の内容を下書きに保存しますか？")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "入力に戻る" }));
    fireEvent.click(screen.getByRole("button", { name: "下書き保存", exact: true }));
    await screen.findByText("下書きを保存しました。");
    expect(saveUsageReportDraftAction).toHaveBeenLastCalledWith(draft.materialId, expect.objectContaining({ expectedUpdatedAt: updatedAt, purposeNote: "樹勢を維持したかった" }));
    await waitFor(() => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    });
  });
});
