import Link from "next/link";

import { buttonRecipe } from "@/components/Button";
import { surfaceCardRecipe } from "@/components/SurfaceCard";

import { css, cva } from "../../../../styled-system/css";
import { ReadingHeading } from "../../articles/_components/Reading";

/** ぼかしの下に置く飾りの見出し。実際の本文は受け取らない。 */
const DECOY_SECTIONS = ["期待した効果", "栽培条件・施用時期", "比較した区", "使用結果の詳細"];

const decoyLine = cva({
  base: { h: "3", mt: "2.5", borderRadius: "mark", bg: "border.strong" },
  variants: { short: { true: { w: "3/5" }, false: {} } },
  defaultVariants: { short: false },
});

/**
 * 未ログイン時の続きの案内。
 * 会員限定の本文は受け取らないため、本文の代わりに飾りの線をぼかす。
 */
export function ReportGate({ reportPath }: { reportPath: string }) {
  const next = encodeURIComponent(reportPath);
  return (
    <section
      className={css({ position: "relative", mt: "2", pb: "20" })}
      aria-label="実証詳細レポートの続きを読む"
    >
      <div
        className={css({
          filter: "blur({blurs.reportGate})",
          pointerEvents: "none",
          userSelect: "none",
        })}
        aria-hidden="true"
      >
        {DECOY_SECTIONS.map((title) => (
          <div key={title}>
            <ReadingHeading as="div">{title}</ReadingHeading>
            <div className={decoyLine()} />
            <div className={decoyLine()} />
            <div className={decoyLine({ short: true })} />
          </div>
        ))}
      </div>
      <div
        className={css({
          position: "absolute",
          inset: "0",
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: "32",
        })}
      >
        <div
          className={css(surfaceCardRecipe.raw(), {
            pointerEvents: "auto",
            position: "sticky",
            top: "28",
            w: "full",
            maxW: "dialog",
            px: "5.5",
            py: "4.5",
            boxShadow: "shadow.lift",
            textAlign: "center",
          })}
        >
          <h2 className={css({ fontSize: "md", fontWeight: "extrabold" })}>
            続きは無料会員登録で読めます（1分）
          </h2>
          <p className={css({ mt: "1", fontSize: "sm", color: "text.subtle" })}>
            使用結果のグラフ・比較した区の詳細が見られます
          </p>
          <Link
            className={css(buttonRecipe.raw({ variant: "primary" }), { mt: "2.5" })}
            href={`/signup/general?next=${next}`}
          >
            無料会員登録して続きを読む
          </Link>
          <div className={css({ mt: "2" })}>
            <Link
              className={css({
                fontSize: "sm",
                color: "primary.700",
                textDecoration: "none",
                whiteSpace: "nowrap",
              })}
              href={`/login?next=${next}`}
            >
              ログインはこちら →
            </Link>
          </div>
        </div>
        <div
          className={css({
            mt: "auto",
            h: "28",
            w: "full",
            bgGradient: "to-b",
            gradientFrom: "transparent",
            gradientTo: "surface.page",
          })}
        />
      </div>
    </section>
  );
}
