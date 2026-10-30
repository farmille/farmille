import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../styled-system/css";

import { ManufacturerLanding } from "./ManufacturerLanding";

const canvas = css({ p: "4", bg: "surface.panel" });

const meta = {
  title: "Pages/sellers/ManufacturerLanding",
  component: ManufacturerLanding,
  args: { applyHref: "/sellers/apply" },
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className={canvas}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ManufacturerLanding>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
