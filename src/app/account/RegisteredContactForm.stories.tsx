import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, userEvent, waitFor, within } from "storybook/test";

import { css } from "../../../styled-system/css";
import { saveRegisteredContactAction } from "./actions";
import { RegisteredContactForm } from "./RegisteredContactForm";

const fmDecorator: Decorator = (Story) => <div className={css({ p: "4" })}>{Story()}</div>;

const meta = {
  title: "Pages/account/RegisteredContactForm",
  component: RegisteredContactForm,
  decorators: [fmDecorator],
  args: {
    saved: {
      familyName: "山田",
      givenName: "太郎",
      phone: "09012345678",
      postalCode: "310-0011",
      prefectureCode: "8",
      cityStreet: "水戸市三の丸1-1",
      buildingName: "",
    },
  },
} satisfies Meta<typeof RegisteredContactForm>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Saved: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "保存する" }));
    await expect(await canvas.findByText("登録情報を保存しました。")).toBeVisible();
  },
};

// 郵便番号の誤りをサーバーが返し、郵便番号の欄へ移動した状態。
export const InvalidPostalCode: Story = {
  beforeEach: () => {
    mocked(saveRegisteredContactAction).mockResolvedValue({
      status: "error",
      message: "入力内容を確認してください。",
      fieldErrors: { postalCode: "郵便番号を7桁で入力してください。" },
      values: { postalCode: "12" },
    });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "保存する" }));
    await waitFor(() => expect(canvas.getByLabelText(/^郵便番号/)).toHaveFocus());
  },
};
