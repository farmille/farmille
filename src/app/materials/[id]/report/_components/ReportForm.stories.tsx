import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { saveUsageReportDraftAction } from "@/app/materials/[id]/report/new/actions";
import { Toaster } from "@/components/Toaster";
import { createBlankUsageReport } from "@/lib/usage-report";
import { ReportForm } from "./ReportForm";
import { filledReport } from "./reportStoryFixture";
const draft = createBlankUsageReport("00000000-0000-4000-8000-000000000101");
const meta = {
  title: "App/Materials/Report/ReportForm",
  component: ReportForm,
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
  args: {
    material: {
      id: draft.materialId,
      name: "土づくり微生物資材",
      manufacturerName: "グリーンバイオ株式会社",
      imageUrl: null,
    },
    userId: "00000000-0000-4000-8000-000000000901",
    crops: [
      {
        id: "00000000-0000-4000-8000-000000000201",
        name: "トマト",
        aliases: ["ミニトマト"],
        groupName: "なす科果菜類",
      },
    ],
    effects: [{ id: "water", name: "水分吸収の改善", categoryName: "栄養利用の効率改善" }],
    materialEffectNames: [],
    favoriteCropIds: [],
    materialCropIds: [],
    draft,
    registeredAddress: { prefectureCode: 45, city: "宮崎市" },
  },
} satisfies Meta<typeof ReportForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Draft: Story = {};
export const Blank: Story = { args: { draft: null } };

export const PartialSaveFailure: Story = {
  beforeEach() {
    mocked(saveUsageReportDraftAction).mockResolvedValueOnce({
      ok: false,
      message: "使用目的の補足を保存できませんでした。再度保存してください。",
      fieldErrors: {},
      savedDraft: { updatedAt: "2026-10-09T00:00:00.000Z", status: "partial" },
    });
  },
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "2 結果" }));
    await userEvent.type(canvas.getByLabelText("使用目的の補足（任意）"), "樹勢を維持したかった");
    await userEvent.click(canvas.getByRole("button", { name: "下書き保存" }));
    await canvas.findByText("使用目的の補足を保存できませんでした。再度保存してください。");
    await userEvent.click(canvas.getByRole("button", { name: "レポートを閉じる" }));
    const dialog = await within(canvasElement.ownerDocument.body).findByRole("alertdialog", {
      name: "入力途中の内容を下書きに保存しますか？",
    });
    await userEvent.click(within(dialog).getByRole("button", { name: "入力に戻る" }));
    await userEvent.click(canvas.getByRole("button", { name: "下書き保存" }));
    await canvas.findByText("下書きを保存しました。");
    await expect(saveUsageReportDraftAction).toHaveBeenLastCalledWith(
      draft.materialId,
      expect.objectContaining({
        expectedUpdatedAt: "2026-10-09T00:00:00.000Z",
        purposeNote: "樹勢を維持したかった",
      }),
    );
  },
};

export const PartialSaveFailureManual: Story = { ...PartialSaveFailure, play: undefined };

/** 全項目を埋めた下書きを提出し、受付の完了画面を出す。 */
export const Submitted: Story = {
  args: {
    draft: {
      ...filledReport,
      materialId: draft.materialId,
      plots: filledReport.plots.map((plot) => ({
        ...plot,
        description: plot.description || "資材を2,000倍に希釈し、10aあたり200Lを葉面散布。",
      })),
      methodDetailsAck: true,
      documentsAck: true,
      guidelineAck: true,
    },
  },
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "5 写真・記事の確認" }));
    await userEvent.click(canvas.getByRole("button", { name: "公開に進む" }));
    await canvas.findByRole("heading", { name: "レポートを受け付けました" });
  },
};

/** 入力の途中で閉じようとすると、下書きに保存するかを確かめる。 */
export const LeaveConfirm: Story = {
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText("品種名"), "桃太郎");
    await userEvent.click(canvas.getByRole("button", { name: "レポートを閉じる" }));
    const dialog = await within(canvasElement.ownerDocument.body).findByRole("alertdialog", {
      name: "入力途中の内容を下書きに保存しますか？",
    });
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "下書きを保存して閉じる" })).toHaveFocus(),
    );
    await waitFor(() =>
      expect(within(dialog).getByRole("button", { name: "保存せずに閉じる" })).toBeVisible(),
    );
  },
};
