import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../styled-system/css";
import * as Icons from "./Icons";

// Icons.tsx はアイコンコンポーネントだけを export するモジュールとして扱う。
const iconEntries = Object.entries(Icons);

const grid = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "3",
});

const cell = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1.5",
  // sizes トークンは定義されていないため、サイズは実値で指定する（bottom-nav 等と同じ流儀）
  flex: "0 0 104px",
  minW: "0",
  p: "3",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  bg: "surface.card",
  color: "text.default",
});

const label = css({
  fontSize: "2xs",
  color: "text.muted",
  textAlign: "center",
  wordBreak: "break-word",
});

/** icons.tsx の全アイコンを名前ラベル付きグリッドで一覧表示する。 */
function IconGallery() {
  return (
    <div className={grid}>
      {iconEntries.map(([name, Icon]) => (
        <div key={name} className={cell}>
          <Icon size={28} />
          <span className={label}>{name}</span>
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: "Components/Icons",
  component: IconGallery,
} satisfies Meta<typeof IconGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {};
