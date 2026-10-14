import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { css } from "../../../../styled-system/css";

import { ContactFields } from "./ContactFields";
import { emptyContact } from "./ContactFields";
const meta = {
  title: "Pages/company-requests/ContactFields",
  component: ContactFields,
  parameters: { nextjs: { appDirectory: true } },
  args: { defaults: emptyContact },
  decorators: [(Story) => <div className={css({ p: "4" })}>{Story()}</div>],
} satisfies Meta<typeof ContactFields>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
