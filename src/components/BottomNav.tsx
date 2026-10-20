import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import Link from "next/link";
import { getSessionUser } from "@/server/auth";
import { cva, css } from "../../styled-system/css";
import { Icon, type IconName } from "@/components/Icon";

const navSlotRecipe = cva({
  base: {
    flexShrink: "0",
    tab: { display: "none" },
  },
  variants: {
    placement: {
      container: {},
      viewport: {
        // fixed で通常フローから外れる SP だけ、本文末尾が隠れない高さを確保する。
        minH: "[calc(var(--spacing-16) + env(safe-area-inset-bottom, 0px))]",
      },
    },
  },
  defaultVariants: {
    placement: "viewport",
  },
});

const navRecipe = cva({
  base: {
    display: "flex",
    alignItems: "stretch",
    bg: "card/94",
    backdropFilter: "[blur({blurs.bar})]",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border.default",
    px: "1.5",
    pt: "1.5",
    pb: "[calc(10px + env(safe-area-inset-bottom, 0px))]",
    zIndex: "bottomNav",
  },
  variants: {
    placement: {
      container: {
        position: "static",
      },
      viewport: {
        position: "fixed",
        left: "0",
        right: "0",
        bottom: "0",
      },
    },
  },
  defaultVariants: {
    placement: "viewport",
  },
});

const itemRecipe = cva({
  base: {
    flex: "1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5",
    pt: "1.5",
    px: "0.5",
    pb: "0.5",
    borderWidth: "0",
    bg: "transparent",
    color: "text.subtle",
    fontSize: "2xs",
    fontWeight: "semibold",
    borderRadius: "button",
    textDecoration: "none",
    cursor: "pointer",
  },
  variants: {
    active: {
      true: { color: "text.brand" },
      false: { color: "text.subtle" },
    },
  },
  defaultVariants: {
    active: false,
  },
});

const postSlot = css({
  flex: "[0 0 62px]",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const plusButton = css({
  w: "12",
  h: "12",
  borderRadius: "pill",
  bg: "primary.700",
  color: "text.inverse",
  display: "grid",
  placeItems: "center",
  boxShadow: "shadow.lift",
  mt: "-4",
  borderWidth: "0",
  cursor: "pointer",
  textDecoration: "none",
});

export type BottomNavActive = "home" | "search" | "post" | "articles" | "me";

type BottomNavProps = {
  active?: BottomNavActive;
  placement?: "container" | "viewport";
};

const ITEMS: Array<{
  id: Exclude<BottomNavActive, "post">;
  href: string;
  label: string;
  name: IconName;
}> = [
  { id: "home", href: "/", label: "ホーム", name: "home" },
  { id: "search", href: "/search", label: "探す", name: "search" },
  { id: "articles", href: "/articles", label: "記事", name: "article" },
  { id: "me", href: "/me", label: "マイページ", name: "person" },
];

export async function BottomNav({ active, placement = "viewport" }: BottomNavProps) {
  const session = await getSessionUser();
  const showPost = session === null || canUseGeneralFeatures(session.accountType);

  return (
    <div className={navSlotRecipe({ placement })} data-ui="mobile-bottom-nav">
      <nav className={navRecipe({ placement })} aria-label="メインナビ">
        {ITEMS.slice(0, 2).map(({ id, href, label, name }) => (
          <Link
            key={id}
            href={href}
            className={itemRecipe({ active: active === id })}
            aria-current={active === id ? "page" : undefined}
          >
            <Icon name={name} size="md" />
            <span>{label}</span>
          </Link>
        ))}
        {showPost ? (
          <div className={postSlot}>
            <Link href="/post" className={plusButton} aria-label="投稿する">
              <Icon name="add" size="md" />
            </Link>
          </div>
        ) : null}
        {ITEMS.slice(2).map(({ id, href, label, name }) => (
          <Link
            key={id}
            href={href}
            className={itemRecipe({ active: active === id })}
            aria-current={active === id ? "page" : undefined}
          >
            <Icon name={name} size="md" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
