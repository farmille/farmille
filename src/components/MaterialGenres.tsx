import { css, cx } from "../../styled-system/css";

const genresStyle = css({ textStyle: "note", fontWeight: "bold", color: "text.brand" });
const restStyle = css({ fontWeight: "normal", color: "text.subtle" });
const visuallyHidden = css({ srOnly: true });

type MaterialGenresProps = {
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
      {shown.join(" ／ ")}
      {rest > 0 ? <span className={restStyle}> ほか{rest}</span> : null}
    </div>
  );
}
