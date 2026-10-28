import { Fragment } from "react";

import { Icon } from "./Icon";
import { css, cx } from "../../styled-system/css";

const lineStyle = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  minW: "0",
  // 作物名の途中ではなく「、」の位置で折り返す
  wordBreak: "keep-all",
  overflowWrap: "anywhere",
});
const iconStyle = css({ color: "text.subtle" });
const visuallyHidden = css({ srOnly: true });

type CropLineProps = {
  crops: readonly string[];
  className?: string;
};

/** 作物の名前を葉のアイコンに続けて並べる。文字の大きさと色は置いた場所に合わせる。 */
export function CropLine({ crops, className }: CropLineProps) {
  return (
    <span className={cx(lineStyle, className)}>
      <Icon name="eco" size="xs" className={iconStyle} />
      <span>
        <span className={visuallyHidden}>作物：</span>
        {crops.map((crop, index) => (
          <Fragment key={crop}>
            {index > 0 ? "、" : null}
            <span>{crop}</span>
          </Fragment>
        ))}
      </span>
    </span>
  );
}
