import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";
import { expect, fireEvent, fn, mocked, userEvent, waitFor, within } from "storybook/test";

import { searchReportMaterialsAction } from "@/app/materials/[id]/report/new/actions";
import { createBlankUsageReport } from "@/lib/usage-report";

import { ReportStepBasics } from "./ReportStepBasics";
import { reportFrame } from "./ReportFormParts";

const blank = createBlankUsageReport("00000000-0000-4000-8000-000000000101");
const crops = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    name: "トマト",
    aliases: ["ミニトマト"],
    groupName: "なす科果菜類",
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    name: "ピーマン",
    aliases: [],
    groupName: "なす科果菜類",
  },
  {
    id: "00000000-0000-4000-8000-000000000203",
    name: "きゅうり",
    aliases: [],
    groupName: "うり科果菜類",
  },
  {
    id: "00000000-0000-4000-8000-000000000204",
    name: "いちご",
    aliases: [],
    groupName: "果実的野菜",
  },
];

const meta = {
  title: "Pages/materials/[id]/report/ReportStepBasics",
  component: ReportStepBasics,
  decorators: [(Story) => <div className={reportFrame}>{Story()}</div>],
  args: {
    input: { ...blank, cropId: crops[0]?.id ?? null, variety: "桃太郎" },
    onChange: fn(),
    errors: {},
    material: {
      id: blank.materialId,
      name: "土づくり微生物資材",
      manufacturerName: "グリーンバイオ株式会社",
      imageUrl: null,
    },
    pageMaterialId: blank.materialId,
    onMaterialChange: fn(),
    crops,
    favoriteCropIds: ["00000000-0000-4000-8000-000000000204"],
    materialCropIds: [
      "00000000-0000-4000-8000-000000000202",
      "00000000-0000-4000-8000-000000000203",
    ],
    onMessage: fn(),
  },
  render: function BasicsStory(args) {
    const [input, setInput] = useState(args.input);
    return <ReportStepBasics {...args} input={input} onChange={setInput} />;
  },
} satisfies Meta<typeof ReportStepBasics>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Missing: Story = {
  args: {
    input: blank,
    errors: { cropId: "使用対象作目を選んでください", variety: "品種を入力してください" },
  },
};
export const VarietyUnknown: Story = {
  args: { input: { ...blank, varietyUnknown: true } },
};

const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

export const CropSearchOpen: Story = {
  args: { input: blank },
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("作目"), "ミニ");
    await page(canvasElement).findByRole("option", {
      name: "トマト なす科果菜類（別名: ミニトマト）",
    });
  },
};

export const CropPicked: Story = {
  args: { input: blank },
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("作目"), "きゅ");
    await userEvent.click(
      await page(canvasElement).findByRole("option", { name: "きゅうり うり科果菜類" }),
    );
    await expect(canvas.getByRole("button", { name: "きゅうりを外す" })).toBeVisible();
    await expect(canvas.getByLabelText("作目")).toHaveValue("");
    await expect(canvas.getByRole("button", { name: "きゅうり" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};

export const MaterialSearchOpen: Story = {
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "変更" }));
    await userEvent.type(canvas.getByRole("combobox", { name: "資材を検索" }), "根圏");
    await page(canvasElement).findByRole("option", { name: "根圏サポートA ファーム技研" });
  },
};

export const QueryChange: Story = {
  async play({ canvasElement, args }) {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "変更" }));
    const input = canvas.getByRole("combobox", { name: "資材を検索" });
    await userEvent.type(input, "根圏");
    await page(canvasElement).findByRole("option");
    await fireEvent.change(input, { target: { value: "別の資材" } });
    await expect(await fireEvent.keyDown(input, { key: "Enter" })).toBe(false);
    await expect(args.onMaterialChange).not.toHaveBeenCalled();
    await expect(page(canvasElement).queryByRole("option")).not.toBeInTheDocument();
  },
};

export const StaleSearchResponse: Story = {
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    // 一覧を開いている間は一覧の外が読み上げから隠れるので、ボタンは先に取っておく
    const respond = canvas.getByRole("button", { name: "古い検索結果を返す" });
    await userEvent.click(canvas.getByRole("button", { name: "変更" }));
    const input = canvas.getByRole("combobox", { name: "資材を検索" });
    await userEvent.type(input, "旧");
    await waitFor(() => expect(searchReportMaterialsAction).toHaveBeenCalledWith("旧"));
    await userEvent.clear(input);
    await userEvent.type(input, "新");
    await waitFor(() => expect(searchReportMaterialsAction).toHaveBeenCalledWith("新"));
    await userEvent.click(respond);
    await userEvent.click(input);
    await expect(page(canvasElement).queryByRole("option")).not.toBeInTheDocument();
  },
  render: function DeferredSearchStory(args) {
    const [response] = useState(() =>
      Promise.withResolvers<Awaited<ReturnType<typeof searchReportMaterialsAction>>>(),
    );
    const [input, setInput] = useState(args.input);
    useEffect(() => {
      mocked(searchReportMaterialsAction).mockImplementation(async (query) => {
        if (query === "旧") {
          return response.promise;
        }
        return { ok: true, data: [] };
      });
    }, [response]);
    return (
      <>
        <p>「旧」を検索してから別の検索語に変え、古い検索結果を返してください。</p>
        <button
          type="button"
          onClick={() =>
            response.resolve({
              ok: true,
              data: [
                {
                  id: "00000000-0000-4000-8000-000000000102",
                  name: "古い候補",
                  manufacturer_name: "ファーム技研",
                  review_count: 0,
                  avg_rating: null,
                  manufacturer_verified_at: null,
                },
              ],
            })
          }
        >
          古い検索結果を返す
        </button>
        <ReportStepBasics {...args} input={input} onChange={setInput} />
      </>
    );
  },
};
