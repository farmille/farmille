import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MockSiteFooter } from "./MockSiteFooter";

const meta = {
  title: "App/Mock/MockSiteFooter",
  component: MockSiteFooter,
  decorators: [(Story) => <div className="fm">{Story()}</div>],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MockSiteFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
