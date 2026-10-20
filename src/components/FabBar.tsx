import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import Link from "next/link";
import { getSessionUser } from "@/server/auth";
import { cva, css, cx } from "../../styled-system/css";
import { buttonRecipe } from "./Button";
import { ReviewCompletionToast } from "./ReviewCompletionToast";

const fabBarRecipe = cva({
  base: {
    zIndex: "fixedBar",
    display: "flex",
    gap: "2",
    bg: "card/90",
    backdropFilter: "[blur({blurs.bar})]",
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
          w: "full",
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
          left: "[auto]",
          right: "[auto]",
          bottom: "4",
          w: "full",
          maxW: "content.form",
          mx: "auto",
          mt: "6",
        },
      },
    },
    look: {
      default: {},
      site: {
        borderRadius: "banner",
        tab: {
          left: "[auto]",
          right: "7",
          bottom: "6",
          w: "auth",
          maxW: "none",
          ml: "0",
          mr: "0",
          mt: "0",
        },
      },
    },
  },
  compoundVariants: [
    { placement: "container", look: "site", css: { tab: { position: "absolute" } } },
    { placement: "viewport", look: "site", css: { maxW: "none", tab: { position: "fixed" } } },
  ],
  defaultVariants: {
    placement: "container",
    look: "default",
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

const reportLink = css(buttonRecipe.raw({ variant: "primary" }), fabLink, { flex: "[1.3]" });

const reviewLink = css(buttonRecipe.raw({ variant: "ghost" }), fabLink, { flex: "1" });

type FabBarProps = {
  reportHref?: string;
  reviewHref?: string;
  placement?: "container" | "viewport";
  className?: string;
  look?: "default" | "site";
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

  return (
    <>
      <ReviewCompletionToast />
      <div
        className={cx(fabBarRecipe({ placement, look }), className)}
        data-ui="responsive-fab-bar"
      >
        <Link href={reportHref} className={reportLink}>
          実証詳細レポートを書く
        </Link>
        <Link href={reviewHref} className={reviewLink} data-tour="review-link">
          感想口コミを書く
        </Link>
      </div>
    </>
  );
}
