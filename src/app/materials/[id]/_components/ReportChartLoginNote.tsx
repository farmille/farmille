import { Icon } from "@/components/Icon";

import { css } from "../../../../../styled-system/css";

const lockedStyle = css({
  mt: "2",
  display: "flex",
  alignItems: "center",
  gap: "1.5",
  px: "2.5",
  py: "2",
  borderRadius: "input",
  bg: "surface.panel",
  textStyle: "note",
  color: "text.subtle",
});

/**
 * 定量データは会員だけに返すので、ログインしていない閲覧者にはグラフの代わりにこれを出す。
 * カードにグラフが出るかは未ログインでは判定できないため、本文の数値が読めることだけを伝える。
 */
export function ReportChartLoginNote() {
  return (
    <p className={lockedStyle}>
      <Icon name="lock" size="xs" />
      区ごとの比較の数値は、ログインすると読めます
    </p>
  );
}
