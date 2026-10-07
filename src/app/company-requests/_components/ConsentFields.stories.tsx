import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { css } from "../../../../styled-system/css";

import { formalPageRecipe } from "./formal-styles";
import { ConsentFields } from "./ConsentFields";
const meta = {
  title: "CompanyApplications/ConsentFields",
  component: ConsentFields,
  parameters: { nextjs: { appDirectory: true } },
  args: { kind: "registration" },
  decorators: [
    (Story) => (
      <div className="fm">
        <div className={css({ p: "4" })}>
          <div className={formalPageRecipe()}>{Story()}</div>
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof ConsentFields>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
