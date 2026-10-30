import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { UiCatalog as Page } from "./UiCatalog";
import { preparePageSession } from "../../../../.storybook/page-session";

const meta = {
  title: "Pages/dev/ui",
  component: Page,
  beforeEach: () => preparePageSession("general"),
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/dev/ui" } } },
  args: {},
} satisfies Meta<typeof Page>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
