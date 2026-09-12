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
        lg: {
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
        lg: {
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

const reportLink = css({
  flex: "1.3",
  paddingInline: "2",
  paddingBlock: "3",
  fontSize: "sm",
  borderRadius: "input",
  whiteSpace: "nowrap",
});

const reviewLink = css({
  flex: "1",
  paddingInline: "2",
  paddingBlock: "3",
  fontSize: "sm",
  borderRadius: "input",
  whiteSpace: "nowrap",
});

type FabBarProps = {
  reportHref?: string;
  reviewHref?: string;
  placement?: "container" | "viewport";
  className?: string;
};

/**
 * 資材詳細等の固定 CTA バー。
 * 文言は D8：「使用レポートを書く」「レビューを書く」。
 */
export async function FabBar({
  reportHref = "/reports/new",
  reviewHref = "/reviews/new",
  placement = "container",
  className,
}: FabBarProps) {
  const session = await getSessionUser();

  if (session !== null && !canUseGeneralFeatures(session.accountType)) {
    return null;
  }

  return (
    <>
      <ReviewCompletionToast />
      <div className={cx(fabBarRecipe({ placement }), className)} data-ui="responsive-fab-bar">
        <Link href={reportHref} className={cx(buttonRecipe({ variant: "primary" }), reportLink)}>
          使用レポートを書く
        </Link>
        <Link href={reviewHref} className={cx(buttonRecipe({ variant: "ghost" }), reviewLink)}>
          レビューを書く
        </Link>
      </div>
    </>
  );
}
