import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { expect, mocked, userEvent, within } from "storybook/test";
import { sellerOperationAction } from "./actions";
import { SellerReviewActions } from "./SellerReviewActions";

const meta = {
  title: "App/Admin/Sellers/SellerReviewActions",
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
    await userEvent.selectOptions(
      canvas.getByLabelText("紐づける資材メーカー"),
      "しおさい資材株式会社",
    );
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
