import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import Page from "./page";
import LegalLayout from "../layout";
import { preparePageSession } from "../../../../.storybook/page-session";

const meta = {
  title: "Pages/legal/[slug]",
  component: Page,
  decorators: [
    (Story) => (
      <LegalLayout>
        <Story />
      </LegalLayout>
    ),
  ],
  beforeEach: () => preparePageSession("general"),
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/legal/terms" } } },
  args: { params: Promise.resolve({ slug: "terms" }) },
} satisfies Meta<typeof Page>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
