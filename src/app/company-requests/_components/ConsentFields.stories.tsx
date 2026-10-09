import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { css } from "../../../../styled-system/css";

import { ConsentFields } from "./ConsentFields";
const meta = {
  title: "CompanyApplications/ConsentFields",
  component: ConsentFields,
  parameters: { nextjs: { appDirectory: true } },
  args: { kind: "registration" },
  decorators: [(Story) => <div className={css({ p: "4" })}>{Story()}</div>],
} satisfies Meta<typeof ConsentFields>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
