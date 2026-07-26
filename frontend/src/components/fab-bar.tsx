import Link from "next/link";
import { getSessionUser } from "@/server/auth";
import { cva, css, cx } from "../../styled-system/css";
import { buttonRecipe } from "./button";
import { ReviewCompletionToast } from "./review-completion-toast";

const fabBarRecipe = cva({
  base: {
    left: "3",
    right: "3",
    bottom: "3",
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
      },
      viewport: {
        position: "fixed",
        maxW: "md",
        mx: "auto",
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

  if (session !== null && session.accountType !== "general") {
    return null;
  }

  return (
    <>
      <ReviewCompletionToast />
      <div className={cx(fabBarRecipe({ placement }), className)}>
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
