import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { expect, mocked, userEvent, waitFor, within } from "storybook/test";
import { sellerOperationAction } from "./actions";
import { SellerReviewActions } from "./SellerReviewActions";

const meta = {
  title: "Pages/admin/sellers/[id]/SellerReviewActions",
  component: SellerReviewActions,
  args: {
    sellerId: "00000000-0000-4000-8000-000000000201",
    status: "applied",
    inviteCode: null,
    manufacturerNames: ["しおさい資材株式会社", "北杜バイオ株式会社"],
  },
} satisfies Meta<typeof SellerReviewActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Applied: Story = {};

export const Approved: Story = {
  args: { status: "approved", inviteCode: "FARM-2026" },
};

export const Suspended: Story = {
  args: { status: "suspended" },
};

export const IssueLogin: Story = {
  beforeEach() {
    mocked(sellerOperationAction).mockResolvedValue({
      status: "approved",
      credentials: {
        loginId: "demo-manufacturer",
        passwordSetupUrl: "https://farmille.example/seller/password/setup?code=storybook-example",
        emailSent: true,
      },
    });
  },
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText("紐づける資材メーカー"));
    const popup = within(canvasElement.ownerDocument.body);
    await userEvent.click(await popup.findByRole("option", { name: "しおさい資材株式会社" }));
    await userEvent.click(canvas.getByRole("button", { name: "確認を完了してログインを発行" }));
    await expect(
      await canvas.findByText("ログインIDとパスワード設定用の案内を発行しました。"),
    ).toBeVisible();
  },
};

export const IssueLoginEmailFailed: Story = {
  ...IssueLogin,
  beforeEach() {
    mocked(sellerOperationAction).mockResolvedValue({
      status: "approved",
      credentials: {
        loginId: "demo-manufacturer",
        passwordSetupUrl: "https://farmille.example/seller/password/setup?code=storybook-example",
        emailSent: false,
      },
    });
  },
};

export const IssueInvite: Story = {
  args: { status: "approved" },
  beforeEach() {
    mocked(sellerOperationAction).mockResolvedValue({
      status: "invited",
      inviteCode: "FARM-2026",
    });
  },
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "招待コードを発行" }));
    await expect(await canvas.findByText("招待コードを発行しました。")).toBeVisible();
  },
};

export const ReissueInvite: Story = {
  ...IssueInvite,
  args: { status: "approved", inviteCode: "FARM-2025" },
  async play({ canvasElement }) {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "招待コードを再発行" }));
    await expect(await canvas.findByText("招待コードを発行しました。")).toBeVisible();
  },
};

const dialog = (canvasElement: HTMLElement) =>
  within(within(canvasElement.ownerDocument.body).getByRole("alertdialog"));

async function openConfirm(canvasElement: HTMLElement, triggerName: string) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: triggerName }));
  await waitFor(() => expect(dialog(canvasElement).getByRole("heading")).toBeVisible());
}

function lastSubmitted(): Record<string, FormDataEntryValue> {
  const call = mocked(sellerOperationAction).mock.lastCall;
  if (call === undefined) throw new Error("sellerOperationAction が呼ばれていません");
  return Object.fromEntries(call[1]);
}

export const RejectConfirm: Story = {
  async play({ canvasElement }) {
    await openConfirm(canvasElement, "却下");
    await userEvent.click(dialog(canvasElement).getByRole("button", { name: "却下する" }));
    await waitFor(() =>
      expect(dialog(canvasElement).getByLabelText("却下理由")).toHaveAttribute(
        "aria-invalid",
        "true",
      ),
    );
    await expect(sellerOperationAction).not.toHaveBeenCalled();
  },
};

export const Rejected: Story = {
  async play({ canvasElement }) {
    await openConfirm(canvasElement, "却下");
    await userEvent.type(
      dialog(canvasElement).getByLabelText("却下理由"),
      "提出書類が不足しています",
    );
    await userEvent.click(dialog(canvasElement).getByRole("button", { name: "却下する" }));
    await expect(
      await within(canvasElement).findByText("Storybook 上でメーカー情報を更新しました。"),
    ).toBeVisible();
    await expect(lastSubmitted()).toEqual({
      rejectedReason: "提出書類が不足しています",
      sellerId: "00000000-0000-4000-8000-000000000201",
      operation: "reject",
    });
  },
};

export const SuspendConfirm: Story = {
  args: { status: "approved" },
  play: ({ canvasElement }) => openConfirm(canvasElement, "凍結する"),
};

export const SuspendDone: Story = {
  args: { status: "approved" },
  async play({ canvasElement }) {
    await openConfirm(canvasElement, "凍結する");
    await userEvent.click(dialog(canvasElement).getByRole("button", { name: "凍結する" }));
    await expect(
      await within(canvasElement).findByText("Storybook 上でメーカー情報を更新しました。"),
    ).toBeVisible();
    await expect(lastSubmitted()).toEqual({
      sellerId: "00000000-0000-4000-8000-000000000201",
      operation: "suspend",
    });
  },
};
