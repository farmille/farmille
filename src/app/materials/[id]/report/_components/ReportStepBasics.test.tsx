import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { searchReportMaterialsAction } from "@/app/materials/[id]/report/new/actions";
import { createBlankUsageReport } from "@/lib/usage-report";
import { ReportStepBasics } from "./ReportStepBasics";

vi.mock("@/app/materials/[id]/report/new/actions", () => ({ searchReportMaterialsAction: vi.fn() }));
const result = { ok: true as const, data: [{ id: "material-a", name: "資材A", manufacturer_name: "メーカー", review_count: 0, avg_rating: null, manufacturer_verified_at: null }] };
function setup() {
  const input = createBlankUsageReport("00000000-0000-4000-8000-000000000101");
  const onMaterialChange = vi.fn();
  render(<ReportStepBasics input={input} onChange={vi.fn()} errors={{}} material={{ id: input.materialId, name: "現在の資材", manufacturerName: "メーカー", imageUrl: null }} pageMaterialId={input.materialId} onMaterialChange={onMaterialChange} crops={[]} favoriteCropIds={[]} materialCropIds={[]} onMessage={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "変更" }));
  return { field: screen.getByRole("combobox", { name: "資材を検索" }), onMaterialChange };
}
async function search() {
  await act(async () => { await vi.advanceTimersByTimeAsync(250); });
}
describe("対象資材の検索", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.mocked(searchReportMaterialsAction).mockReset(); });
  afterEach(() => { vi.useRealTimers(); });
  it("検索語の変更直後に古い候補を選べない", async () => {
    vi.mocked(searchReportMaterialsAction).mockResolvedValue(result);
    const { field, onMaterialChange } = setup();
    fireEvent.change(field, { target: { value: "資材A" } });
    await search();
    expect(screen.getByRole("option")).toHaveTextContent("資材A");
    fireEvent.change(field, { target: { value: "資材B" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(onMaterialChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });
  it("検索語を消した後に届く応答を破棄する", async () => {
    const response = Promise.withResolvers<typeof result>();
    vi.mocked(searchReportMaterialsAction).mockReturnValue(response.promise);
    const { field } = setup();
    fireEvent.change(field, { target: { value: "資材A" } });
    await search();
    fireEvent.change(field, { target: { value: "" } });
    await act(async () => { response.resolve(result); });
    fireEvent.change(field, { target: { value: "資材B" } });
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });
});
