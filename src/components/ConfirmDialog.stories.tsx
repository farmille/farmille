import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { Field } from "./form/Field";
import { Textarea } from "./form/Textarea";

const meta = {
  title: "Components/ConfirmDialog",
  component: ConfirmDialog,
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const deleteReview = {
  title: "感想口コミを削除しますか？",
  description: "削除した感想口コミと写真は元に戻せません。",
  confirmLabel: "削除する",
  pendingLabel: "削除中…",
};

const deleteTrigger = (
  <Button size="sm" variant="danger">
    削除
  </Button>
);

const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

async function openFrom(canvasElement: HTMLElement, triggerName: string) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: triggerName }));
  await waitFor(() => expect(page(canvasElement).getByRole("alertdialog")).toBeVisible());
}

// トリガーのみ表示（ダイアログは閉じた状態）
export const Closed: Story = {
  args: { ...deleteReview, trigger: deleteTrigger, onConfirm: fn() },
};

// トリガーで開いた状態。危険な操作なので最初のフォーカスはキャンセルに置く
export const Opened: Story = {
  args: { ...deleteReview, trigger: deleteTrigger, onConfirm: fn() },
  play: ({ canvasElement }) => openFrom(canvasElement, "削除"),
};

// action（フォーム送信）版を開いた状態
export const OpenedWithFormAction: Story = {
  args: {
    ...deleteReview,
    trigger: deleteTrigger,
    action: fn((_formData: FormData) => undefined).mockName("deleteAction"),
  },
  play: ({ canvasElement }) => openFrom(canvasElement, "削除"),
};

// 前向きな操作（primary）の確認。最初のフォーカスは確認ボタンに置く
export const PrimaryConfirm: Story = {
  args: {
    title: "記事を公開しますか？",
    description: "公開すると資材ページの記事一覧にすぐ表示されます。",
    confirmLabel: "公開する",
    pendingLabel: "公開中…",
    cancelLabel: "あとで",
    tone: "primary",
    trigger: <Button>公開</Button>,
    onConfirm: fn(),
  },
  play: ({ canvasElement }) => openFrom(canvasElement, "公開"),
};

// 開閉を呼び出し側で持ち、3つ目の選択肢を添えた状態。3つのボタンは縦に積む
export const ControlledWithAlternative: Story = {
  args: {
    title: "入力途中の内容を下書きに保存しますか？",
    description: "保存すると、マイページの「下書き」から続きを入力できます。",
    confirmLabel: "下書きを保存して閉じる",
    pendingLabel: "保存中…",
    cancelLabel: "入力に戻る",
    tone: "primary",
    alternative: { label: "保存せずに閉じる", onSelect: fn().mockName("discard") },
    open: true,
    onOpenChange: fn(),
    onConfirm: fn(),
  },
};

// 理由の入力を必須にした action 版。空のまま確定すると送らずに入力欄のエラーを示す
export const ActionWithRequiredReason: Story = {
  args: {
    title: "この申請を却下しますか？",
    description: "却下の理由は申請者に通知されます。",
    confirmLabel: "却下する",
    pendingLabel: "却下中…",
    trigger: deleteTrigger,
    action: fn((_formData: FormData) => undefined).mockName("rejectAction"),
    children: (
      <Field label="却下の理由" name="reason" requirement="required">
        <Textarea placeholder="申請者に伝える理由を入力してください" />
      </Field>
    ),
  },
  play: async ({ canvasElement }) => {
    await openFrom(canvasElement, "削除");
    await userEvent.click(page(canvasElement).getByRole("button", { name: "却下する" }));
    await waitFor(() =>
      expect(page(canvasElement).getByLabelText("却下の理由")).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );
  },
};

// 呼び出し側の処理中。確認ボタンは文言を変えて押せなくし、キャンセルも押せない
export const Pending: Story = {
  args: { ...deleteReview, open: true, onOpenChange: fn(), pending: true, onConfirm: fn() },
};

// 控えめな導線（ghost トリガー）から危険な操作を確かめる場合
export const GhostTrigger: Story = {
  args: {
    ...deleteReview,
    trigger: (
      <Button size="sm" variant="ghost">
        削除
      </Button>
    ),
    onConfirm: fn(),
  },
};

// トリガーが押せない状態（公開状態の切り替え中など）
export const TriggerDisabled: Story = {
  args: {
    ...deleteReview,
    trigger: (
      <Button disabled size="sm" variant="danger">
        削除
      </Button>
    ),
    onConfirm: fn(),
  },
};
