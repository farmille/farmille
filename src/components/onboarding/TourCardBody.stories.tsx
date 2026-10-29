import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { css } from "../../../styled-system/css";
import { TourCardBody } from "./TourCardBody";

const cardStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
  maxW: "guide",
  m: "4",
  px: "4.5",
  pt: "3",
  pb: "3.5",
  bg: "surface.card",
  borderRadius: "card",
});

const meta = {
  title: "Components/Onboarding/TourCardBody",
  component: TourCardBody,
  args: { onSkipStep: fn(), onEnd: fn() },
  decorators: [
    (Story) => (
      <div className={cardStyle}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TourCardBody>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPrimary: Story = {
  args: {
    section: 1,
    title: "栽培作目を選択",
    body: "栽培している作目を候補から選び（複数選択可）、「保存する」を押してください。",
    primary: { label: "入力する", onClick: fn() },
  },
};

export const BodyOnly: Story = {
  args: {
    section: 2,
    body: "候補を選択すると、該当する資材だけが表示されます。表示された資材を1つ押して、資材ページを開いてください。",
  },
};
