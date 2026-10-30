import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import type { ReportActionState } from "@/server/actions/reports";
import { REPORT_REASON_OPTIONS } from "@/server/mutations/report-reasons";
import { ReportDialog } from "./ReportDialog";

// 送信すると成功状態を返すスタブ（実サーバーアクションは呼ばない）
const successAction = fn(
  async (_previousState: ReportActionState, _formData: FormData): Promise<ReportActionState> => ({
    status: "success",
  }),
).mockName("createReportAction");

// 送信すると想定内エラー（重複通報）を返すスタブ
const duplicateErrorAction = fn(
  async (_previousState: ReportActionState, _formData: FormData): Promise<ReportActionState> => ({
    status: "error",
    message: "この感想口コミはすでに通報済みです。",
  }),
).mockName("createReportActionError");

const meta = {
  title: "Pages/Shared/ReportDialog",
  component: ReportDialog,
  args: {
    action: successAction,
    reasonOptions: REPORT_REASON_OPTIONS,
    title: "この感想口コミを通報する",
  },
} satisfies Meta<typeof ReportDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

async function open(canvasElement: HTMLElement, triggerName: string) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: triggerName }));
  await waitFor(() => expect(page(canvasElement).getByRole("dialog")).toBeVisible());
}

async function chooseReason(canvasElement: HTMLElement, reason: string) {
  await userEvent.click(page(canvasElement).getByRole("combobox", { name: "通報理由" }));
  await userEvent.click(await page(canvasElement).findByRole("option", { name: reason }));
}

// 通報導線のテキストリンクのみ（ダイアログは閉じた状態）
export const Closed: Story = {};

// play でモーダルを開いた状態（理由 select＋自由記述フォーム）
export const Opened: Story = {
  play: ({ canvasElement }) => open(canvasElement, "通報する"),
};

export const ReasonListOpen: Story = {
  play: async ({ canvasElement }) => {
    await open(canvasElement, "通報する");
    await userEvent.click(page(canvasElement).getByRole("combobox", { name: "通報理由" }));
    await waitFor(() => expect(page(canvasElement).getByRole("listbox")).toBeVisible());
  },
};

export const ReasonMissing: Story = {
  args: {
    triggerLabel: "感想口コミを通報する",
  },
  play: async ({ canvasElement }) => {
    await open(canvasElement, "感想口コミを通報する");
    await userEvent.click(page(canvasElement).getByRole("button", { name: "通報する" }));
    await waitFor(() =>
      expect(page(canvasElement).getByRole("combobox", { name: "通報理由" })).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );
  },
};

// 理由を選んで送信し、受付完了画面まで進んだ状態
// （送信ボタンと区別するため、トリガーの文言を変えている）
export const SubmitSuccess: Story = {
  args: {
    triggerLabel: "感想口コミを通報する",
  },
  play: async ({ canvasElement }) => {
    await open(canvasElement, "感想口コミを通報する");
    await chooseReason(canvasElement, "スパム・宣伝目的");
    await userEvent.click(page(canvasElement).getByRole("button", { name: "通報する" }));
    await waitFor(() =>
      expect(
        page(canvasElement).getByRole("dialog", { name: "通報を受け付けました" }),
      ).toBeVisible(),
    );
  },
};

// 送信が想定内エラーになった状態（重複通報）
export const SubmitError: Story = {
  args: {
    action: duplicateErrorAction,
    triggerLabel: "感想口コミを通報する",
  },
  play: async ({ canvasElement }) => {
    await open(canvasElement, "感想口コミを通報する");
    await chooseReason(canvasElement, "不適切な内容");
    await userEvent.click(page(canvasElement).getByRole("button", { name: "通報する" }));
    await waitFor(() =>
      expect(page(canvasElement).getByRole("alert")).toHaveTextContent(
        "この感想口コミはすでに通報済みです。",
      ),
    );
  },
};
