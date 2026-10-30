import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../styled-system/css";
import { BackLink } from "./BackLink";
import { Icon } from "./Icon";

const meta = {
  title: "Components/Navigation/BackLink",
  component: BackLink,
  args: {
    href: "/search",
    className: css({
      display: "inline-flex",
      alignItems: "center",
      gap: "1.5",
      color: "text.muted",
      fontSize: "sm",
      fontWeight: "bold",
      textDecoration: "none",
    }),
    children: (
      <>
        <Icon name="chevron_left" size="sm" />
        戻る
      </>
    ),
  },
} satisfies Meta<typeof BackLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** SP のアプリバーに置く、文字の無いアイコンだけの形。読み上げ名を付ける。 */
export const IconOnly: Story = {
  args: {
    "aria-label": "戻る",
    className: css({
      w: "8",
      h: "8",
      display: "grid",
      placeItems: "center",
      color: "text.muted",
    }),
    children: <Icon name="chevron_left" size="md" />,
  },
};
