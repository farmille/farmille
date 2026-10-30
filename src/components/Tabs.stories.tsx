import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useReducer } from "react";

import { css } from "../../styled-system/css";
import { Tabs } from "./Tabs";

const panelStyle = css({ mt: "3", fontSize: "sm", lineHeight: "relaxed" });

function EditorTabs({ initial }: { initial: "write" | "preview" }) {
  const [tab, setTab] = useReducer(
    (_current: "write" | "preview", next: "write" | "preview") => next,
    initial,
  );
  return (
    <Tabs
      aria-label="本文エディタ"
      value={tab}
      onValueChange={setTab}
      tabs={[
        {
          value: "write",
          label: "編集",
          panel: <p className={panelStyle}>## 使ってみた結果{"\n"}定植後の活着が揃った。</p>,
        },
        {
          value: "preview",
          label: "プレビュー",
          panel: (
            <div className={panelStyle}>
              <h2 className={css({ fontSize: "lg" })}>使ってみた結果</h2>
              <p>定植後の活着が揃った。</p>
            </div>
          ),
        },
      ]}
    />
  );
}

const meta = {
  title: "Components/Navigation/Tabs",
  component: EditorTabs,
  args: { initial: "write" },
} satisfies Meta<typeof EditorTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Write: Story = {};

export const Preview: Story = { args: { initial: "preview" } };
