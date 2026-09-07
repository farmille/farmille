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
    message: "このレビューはすでに通報済みです。",
  }),
).mockName("createReportActionError");

const meta = {
  title: "Components/ReportDialog",
  component: ReportDialog,
  args: {
    action: successAction,
    reasonOptions: REPORT_REASON_OPTIONS,
    title: "このレビューを通報する",
  },
} satisfies Meta<typeof ReportDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// 通報導線のテキストリンクのみ（ダイアログは閉じた状態）
export const Closed: Story = {};

// play でモーダルを開いた状態（理由 select＋自由記述フォーム）
export const Opened: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "通報する" }));
  },
};

// 理由を選んで送信し、受付完了画面まで進んだ状態
// （送信ボタンと区別するため、トリガーの文言を変えている）
export const SubmitSuccess: Story = {
  args: {
    triggerLabel: "レビューを通報する",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "レビューを通報する" }));
    await userEvent.selectOptions(canvas.getByLabelText("通報理由"), "spam");
    await userEvent.click(canvas.getByRole("button", { name: "通報する" }));
    await waitFor(() => expect(canvas.getByText("通報を受け付けました")).toBeInTheDocument());
  },
};

// 送信が想定内エラーになった状態（重複通報）
export const SubmitError: Story = {
  args: {
    action: duplicateErrorAction,
    triggerLabel: "レビューを通報する",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "レビューを通報する" }));
    await userEvent.selectOptions(canvas.getByLabelText("通報理由"), "inappropriate");
    await userEvent.click(canvas.getByRole("button", { name: "通報する" }));
    await waitFor(() => expect(canvas.getByRole("alert")).toBeInTheDocument());
  },
};
