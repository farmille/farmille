import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as v from "valibot";

import { css } from "../../../styled-system/css";

import { PersistedInput } from "./PersistedInput";

const noteStyle = css({ color: "text.subtle", fontSize: "sm" });

const meta = {
  title: "Components/Form/PersistedInput",
  component: PersistedInput<string>,
  args: { name: "note", schema: v.string(), unsaved: "保存していないメモ", restore: () => {} },
  render: (args) => (
    <>
      <PersistedInput {...args} />
      <p className={noteStyle}>
        表示を持たず、保存していない入力をタブを閉じるまで控え、再読み込みの後に戻します。
      </p>
    </>
  ),
} satisfies Meta<typeof PersistedInput<string>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
