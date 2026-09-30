import Link from "next/link";
import { buttonRecipe } from "@/components/Button";
import { css } from "../../styled-system/css";

/** 会員限定の本文は受け取らず、装飾と登録・ログイン導線だけを表示する。 */
export function ReportReadingGate({ reportPath }: { reportPath: string }) {
  const next = encodeURIComponent(reportPath);
  return (
    <section
      aria-label="実証詳細レポートの続きを読む"
      className={css({
        position: "relative",
        my: "6",
        overflow: "hidden",
        borderRadius: "card",
        borderWidth: "1px",
        borderColor: "border.default",
        bg: "surface.card",
      })}
    >
      <div
        aria-hidden="true"
        className={css({
          position: "absolute",
          inset: "0",
          p: "5",
          display: "flex",
          flexDirection: "column",
          gap: "5",
          opacity: "0.2",
          filter: "blur({blurs.reportGate})",
          pointerEvents: "none",
          userSelect: "none",
        })}
      >
        {[0, 1, 2, 3, 4, 5].map((line) => (
          <div key={line} className={css({ h: "3", bg: "text.subtle", borderRadius: "pill" })} />
        ))}
      </div>
      <div
        className={css({
          position: "relative",
          px: "5",
          py: "10",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4",
        })}
      >
        <h2 className={css({ m: "0", fontSize: "xl", fontWeight: "700", lineHeight: "relaxed" })}>
          続きは無料会員登録で読めます
        </h2>
        <p className={css({ m: "0", fontSize: "md", lineHeight: "relaxed", color: "text.muted" })}>
          定量データのグラフ・使い方の詳細・比較条件が見られます
        </p>
        <Link
          href={`/signup/general?next=${next}`}
          className={buttonRecipe({ variant: "primary" })}
        >
          無料会員登録して続きを読む
        </Link>
        <Link
          href={`/login?next=${next}`}
          className={css({
            color: "primary.700",
            textDecoration: "underline",
            fontSize: "md",
          })}
        >
          ログインはこちら →
        </Link>
      </div>
    </section>
  );
}
