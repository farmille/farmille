import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../styled-system/css";
import { Badge } from "./Badge";
import {
  FieldError,
  FormNotice,
  ImagePlaceholderIcon,
  RequiredBadge,
  VisibilityTag,
} from "./FormParts";

const meta = {
  title: "Components/FormParts",
  component: VisibilityTag,
  args: { visibility: "public" },
} satisfies Meta<typeof VisibilityTag>;

export default meta;
type Story = StoryObj<typeof meta>;

const row = css({ display: "flex", alignItems: "center", gap: "2", flexWrap: "wrap" });

export const AllParts: Story = {
  render: () => (
    <div className={css({ display: "flex", flexDirection: "column", gap: "4" })}>
      <div className={row}>
        ニックネーム
        <RequiredBadge />
        <Badge variant="optional">任意</Badge>
        <Badge variant="optional">あとで設定可</Badge>
      </div>
      <div className={row}>
        <VisibilityTag visibility="public" />
        <VisibilityTag visibility="private" />
      </div>
      <div className={row}>
        <ImagePlaceholderIcon />
      </div>
      <FieldError id="handle-error" message="ニックネームを入力してください。" />
      <FormNotice tone="error">
        保存できませんでした。時間をおいてもう一度お試しください。
      </FormNotice>
      <FormNotice tone="info">プロフィールを保存しました。</FormNotice>
    </div>
  ),
};
