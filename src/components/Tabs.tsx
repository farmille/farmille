import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";

import { pillRowStyle, pillStyle } from "./FilterPills";

export type TabItem<V extends string> = {
  value: V;
  label: string;
  panel: ReactNode;
};

/**
 * 同じ画面内で表示を切り替えるタブ。見た目は FilterPills のピルと揃える。
 * 矢印キーでタブ間を移動し、Enter / Space で切り替える。選んでいないパネルは描画しない。
 */
export function Tabs<V extends string>({
  "aria-label": ariaLabel,
  value,
  onValueChange,
  tabs,
  className,
}: {
  "aria-label": string;
  value: V;
  onValueChange: (value: V) => void;
  tabs: readonly TabItem<V>[];
  className?: string;
}) {
  return (
    <BaseTabs.Root
      value={value}
      onValueChange={(next) => {
        const tab = tabs.find((item) => item.value === next);

        if (tab !== undefined) onValueChange(tab.value);
      }}
      className={className}
    >
      <BaseTabs.List aria-label={ariaLabel} className={pillRowStyle}>
        {tabs.map((tab) => (
          <BaseTabs.Tab key={tab.value} value={tab.value} className={pillStyle}>
            {tab.label}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
      {tabs.map((tab) => (
        <BaseTabs.Panel key={tab.value} value={tab.value}>
          {tab.panel}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
}
