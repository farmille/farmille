import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../../../styled-system/css";

import { PROCEDURES } from "./manufacturer-guide";
import { ProcedureDetail } from "./ProcedureDetail";

const meta = {
  title: "Pages/sellers/ProcedureDetail",
  component: ProcedureDetail,
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className={css({ p: "4", bg: "surface.panel" })}>{Story()}</div>],
  args: { procedure: PROCEDURES.owner },
} satisfies Meta<typeof ProcedureDetail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NeedsMembership: Story = {};
