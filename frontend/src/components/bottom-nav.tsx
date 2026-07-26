import Link from "next/link";
import { getSessionUser } from "@/server/auth";
import { cva, css } from "../../styled-system/css";
import { ArticlesNavIcon, HomeNavIcon, MeNavIcon, PlusIcon, SearchIcon } from "./icons";

const navRecipe = cva({
  base: {
    flexShrink: "0",
    display: "flex",
    alignItems: "stretch",
    bg: "card/94",
    backdropFilter: "blur(10px)",
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: "border.default",
    px: "1.5",
    pt: "1.5",
    pb: "calc(10px + env(safe-area-inset-bottom, 0px))",
    zIndex: "25",
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
    fontWeight: "600",
    borderRadius: "button",
    textDecoration: "none",
    cursor: "pointer",
  },
  variants: {
    active: {
      true: { color: "brand.primary" },
      false: { color: "text.subtle" },
    },
  },
  defaultVariants: {
    active: false,
  },
});

const postSlot = css({
  flex: "0 0 62px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const plusButton = css({
  w: "46px",
  h: "46px",
  borderRadius: "pill",
  bg: "brand.primary",
  color: "surface.card",
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
  active: BottomNavActive;
};

const ITEMS: Array<{
  id: Exclude<BottomNavActive, "post">;
  href: string;
  label: string;
  Icon: typeof HomeNavIcon;
}> = [
  { id: "home", href: "/", label: "ホーム", Icon: HomeNavIcon },
  { id: "search", href: "/search", label: "探す", Icon: SearchIcon },
  { id: "articles", href: "/articles", label: "記事", Icon: ArticlesNavIcon },
  { id: "me", href: "/me", label: "マイページ", Icon: MeNavIcon },
];

/** 5枠 BottomNav。中央は丸型＋投稿。現在地ハイライト。 */
export async function BottomNav({ active }: BottomNavProps) {
  const session = await getSessionUser();
  const showPost = session === null || session.accountType === "general";

  return (
    <nav className={navRecipe()} aria-label="メインナビ">
      {ITEMS.slice(0, 2).map(({ id, href, label, Icon }) => (
        <Link
          key={id}
          href={href}
          className={itemRecipe({ active: active === id })}
          aria-current={active === id ? "page" : undefined}
        >
          <Icon size={21} />
          <span>{label}</span>
        </Link>
      ))}
      {showPost ? (
        <div className={postSlot}>
          <Link href="/post" className={plusButton} aria-label="投稿する">
            <PlusIcon />
          </Link>
        </div>
      ) : null}
      {ITEMS.slice(2).map(({ id, href, label, Icon }) => (
        <Link
          key={id}
          href={href}
          className={itemRecipe({ active: active === id })}
          aria-current={active === id ? "page" : undefined}
        >
          <Icon size={21} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
