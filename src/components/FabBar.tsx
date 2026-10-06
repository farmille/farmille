import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import Link from "next/link";
import { getSessionUser } from "@/server/auth";
import { cva, css, cx } from "../../styled-system/css";
import { buttonRecipe } from "./Button";
import { ReviewCompletionToast } from "./ReviewCompletionToast";

const fabBarRecipe = cva({
  base: {
    zIndex: "20",
    display: "flex",
    gap: "2",
    bg: "card/90",
    backdropFilter: "blur(10px)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "card",
    boxShadow: "shadow.lift",
    p: "2",
  },
  variants: {
    placement: {
      container: {
        position: "absolute",
        left: "3",
        right: "3",
        bottom: "3",
        tab: {
          position: "static",
          w: "100%",
          maxW: "content.form",
          ml: "auto",
          mt: "6",
        },
      },
      viewport: {
        position: "fixed",
        left: "3",
        right: "3",
        bottom: "3",
        maxW: "content.medium",
        mx: "auto",
        tab: {
          position: "sticky",
          left: "auto",
          right: "auto",
          bottom: "4",
          w: "100%",
          maxW: "content.form",
          mx: "auto",
          mt: "6",
        },
      },
    },
  },
  defaultVariants: {
    placement: "container",
  },
});

// cx で recipe のクラスと並べると同じプロパティの勝敗が CSS の出力順で決まるため、スタイルの段階で上書きする。
const fabLink = {
  paddingInline: "2",
  paddingBlock: "3",
  fontSize: "sm",
  borderRadius: "input",
  whiteSpace: "nowrap",
} as const;

const reportLink = css(buttonRecipe.raw({ variant: "primary" }), fabLink, { flex: "1.3" });

const reviewLink = css(buttonRecipe.raw({ variant: "ghost" }), fabLink, { flex: "1" });

type FabBarProps = {
  reportHref?: string;
  reviewHref?: string;
  placement?: "container" | "viewport";
  className?: string;
  /**
   * "mock" は完成見本の画面（.fm の中）用で、見本 .fab-bar の構造とクラスで出す
   * （スタイルは src/app/_mock/mock.css と chrome.css）。見本にない画面は既定のまま。
   */
  look?: "default" | "mock";
};

/**
 * 資材詳細等の固定 CTA バー。
 * 文言は D8：「実証詳細レポートを書く」「感想口コミを書く」。
 */
export async function FabBar({
  reportHref = "/reports/new",
  reviewHref = "/reviews/new",
  placement = "container",
  className,
  look = "default",
}: FabBarProps) {
  const session = await getSessionUser();

  if (session !== null && !canUseGeneralFeatures(session.accountType)) {
    return null;
  }

  if (look === "mock") {
    return (
      <>
        <ReviewCompletionToast />
        <div
          className={cx("fab-bar", placement === "viewport" && "is-fixed", className)}
          data-ui="responsive-fab-bar"
        >
          <Link href={reportHref} className="btn btn-primary fab-report">
            実証詳細レポートを書く
          </Link>
          <Link href={reviewHref} className="btn btn-ghost fab-review">
            感想口コミを書く
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <ReviewCompletionToast />
      <div className={cx(fabBarRecipe({ placement }), className)} data-ui="responsive-fab-bar">
        <Link href={reportHref} className={reportLink}>
          実証詳細レポートを書く
        </Link>
        <Link href={reviewHref} className={reviewLink}>
          感想口コミを書く
        </Link>
      </div>
    </>
  );
}
