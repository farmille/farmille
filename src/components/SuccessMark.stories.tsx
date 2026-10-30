import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css, cx } from "../../styled-system/css";
import { SuccessMark, completionStepRecipe } from "./SuccessMark";

const meta = {
  title: "Components/Feedback/SuccessMark",
  component: SuccessMark,
} satisfies Meta<typeof SuccessMark>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Soft: Story = {};

export const Solid: Story = { args: { tone: "solid" } };

export const Entrance: Story = {
  render: () => (
    <div className={css({ textAlign: "center", pt: "10" })}>
      <SuccessMark entrance className={css({ mb: "4.5" })} />
      <h1 className={cx(css({ fontSize: "2xl" }), completionStepRecipe({ step: 1 }))}>
        申請を受け付けました
      </h1>
      <p
        className={cx(
          css({ mt: "2", textStyle: "supporting", color: "text.muted" }),
          completionStepRecipe({ step: 2 }),
        )}
      >
        内容を確認し、ご登録の連絡先メールアドレスへご案内します。
      </p>
      <p
        className={cx(
          css({ mt: "6", fontSize: "sm", color: "text.brand" }),
          completionStepRecipe({ step: 3 }),
        )}
      >
        ホームへ
      </p>
    </div>
  ),
};
