import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../styled-system/css";
import { HomeVoices } from "./HomeVoices";
import { homeVoiceReports, homeVoiceReviews } from "./story-fixtures";

const meta = {
  title: "App/Home/HomeVoices",
  component: HomeVoices,
  decorators: [(Story) => <div className={css({ px: "4", pb: "6" })}>{Story()}</div>],
  args: { reports: homeVoiceReports, reviews: homeVoiceReviews },
} satisfies Meta<typeof HomeVoices>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { reports: [], reviews: [] } };
