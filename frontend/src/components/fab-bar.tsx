import Link from "next/link";
import { cva, css, cx } from "../../styled-system/css";
import { buttonRecipe } from "./button";

const fabBarRecipe = cva({
  base: {
    position: "absolute",
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
  className?: string;
};

/**
 * 資材詳細等の固定 CTA バー。
 * 文言は D8：「使用レポートを書く」「レビューを書く」。
 */
export function FabBar({
  reportHref = "/reports/new",
  reviewHref = "/reviews/new",
  className,
}: FabBarProps) {
  return (
    <div className={cx(fabBarRecipe(), className)}>
      <Link href={reportHref} className={cx(buttonRecipe({ variant: "primary" }), reportLink)}>
        使用レポートを書く
      </Link>
      <Link href={reviewHref} className={cx(buttonRecipe({ variant: "ghost" }), reviewLink)}>
        レビューを書く
      </Link>
    </div>
  );
}
