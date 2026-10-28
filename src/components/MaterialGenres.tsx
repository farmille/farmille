import { css, cx } from "../../styled-system/css";

const genresStyle = css({ textStyle: "note", fontWeight: "bold", color: "text.brand" });
// 略称の途中では折り返さず、区切りの位置で折り返す
const nameStyle = css({ whiteSpace: "nowrap" });
const restStyle = css({ fontWeight: "normal", color: "text.subtle", whiteSpace: "nowrap" });
const visuallyHidden = css({ srOnly: true });

type MaterialGenresProps = {
  /** 資材ジャンルの略称 */
  names: readonly string[];
  /** 並べる数の上限。超えた分は「ほか n」とまとめる */
  max?: number;
  className?: string;
};

/** 資材名の上に添える資材ジャンルの並び。 */
export function MaterialGenres({ names, max, className }: MaterialGenresProps) {
  if (names.length === 0) return null;
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <div className={cx(genresStyle, className)}>
      <span className={visuallyHidden}>資材ジャンル：</span>
      {shown.map((name, index) => (
        <span key={name}>
          {index > 0 ? " ／ " : null}
          <span className={nameStyle}>{name}</span>
        </span>
      ))}
      {rest > 0 ? <span className={restStyle}> ほか{rest}</span> : null}
    </div>
  );
}
