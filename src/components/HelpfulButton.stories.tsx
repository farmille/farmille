import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import type { HelpfulState } from "@/server/actions/helpful";
import { HelpfulButton } from "./HelpfulButton";

/** ガイドの HelpfulAction 型どおりのローカルスタブ。押下ごとに voted と count をトグルする。 */
const toggleHelpful = fn(
  async (previous: HelpfulState): Promise<HelpfulState> =>
    previous.voted
      ? { voted: false, count: previous.count - 1 }
      : { voted: true, count: previous.count + 1 },
).mockName("action");

const meta = {
  title: "Components/HelpfulButton",
  component: HelpfulButton,
  args: {
    action: toggleHelpful,
    count: 18,
  },
} satisfies Meta<typeof HelpfulButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CardNotVoted: Story = {
  args: {
    voted: false,
    layout: "card",
  },
};

export const CardVoted: Story = {
  args: {
    voted: true,
    layout: "card",
    count: 19,
  },
};

export const DetailNotVoted: Story = {
  args: {
    voted: false,
    layout: "detail",
  },
};

export const DetailVoted: Story = {
  args: {
    voted: true,
    layout: "detail",
    count: 19,
  },
};
