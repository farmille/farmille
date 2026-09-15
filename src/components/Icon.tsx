import {
  MdSearch,
  MdOutlineBookmarkBorder,
  MdBookmark,
  MdOutlineVisibility,
  MdChevronLeft,
  MdShare,
  MdOutlineVerified,
  MdOutlinePerson,
  MdOutlineThumbUp,
  MdChevronRight,
  MdOutlineHome,
  MdOutlineArticle,
  MdAdd,
  MdOutlineImage,
  MdCheck,
  MdArrowForward,
  MdArrowBack,
  MdNorthEast,
  MdClose,
  MdStarBorder,
  MdStar,
} from "react-icons/md";
import { cva, cx, type RecipeVariantProps } from "../../styled-system/css";

// Google Material Icons を用途名で参照する。
const glyphs = {
  search: MdSearch,
  bookmark: MdOutlineBookmarkBorder,
  bookmark_filled: MdBookmark,
  visibility: MdOutlineVisibility,
  chevron_left: MdChevronLeft,
  share: MdShare,
  verified: MdOutlineVerified,
  person: MdOutlinePerson,
  thumb_up: MdOutlineThumbUp,
  chevron_right: MdChevronRight,
  home: MdOutlineHome,
  article: MdOutlineArticle,
  add: MdAdd,
  image: MdOutlineImage,
  check: MdCheck,
  arrow_forward: MdArrowForward,
  arrow_back: MdArrowBack,
  north_east: MdNorthEast,
  close: MdClose,
  star: MdStarBorder,
  star_filled: MdStar,
};

const iconRecipe = cva({
  base: {
    display: "inline-block",
    flexShrink: "0",
    verticalAlign: "middle",
    fill: "currentColor",
  },
  variants: {
    size: {
      "2xs": { width: "icon.2xs", height: "icon.2xs" },
      xs: { width: "icon.xs", height: "icon.xs" },
      sm: { width: "icon.sm", height: "icon.sm" },
      md: { width: "icon.md", height: "icon.md" },
      lg: { width: "icon.lg", height: "icon.lg" },
      xl: { width: "icon.xl", height: "icon.xl" },
      "2xl": { width: "icon.2xl", height: "icon.2xl" },
    },
  },
  defaultVariants: { size: "md" },
});

export type IconName = keyof typeof glyphs | "leaf";
export type IconProps = RecipeVariantProps<typeof iconRecipe> & {
  name: IconName;
  className?: string;
  /** 単独で意味を伝える場合の読み上げ名。装飾アイコンでは省略する。 */
  label?: string;
};

/** サイズをトークンで指定するアイコン。色は親要素から継承する。 */
export function Icon({ name, size, className, label }: IconProps) {
  const accessibility = {
    "aria-hidden": label === undefined ? true : undefined,
    role: label === undefined ? undefined : "img",
    "aria-label": label,
    focusable: false,
  };
  const iconClassName = cx(iconRecipe({ size }), className);

  // 葉は Farmille 固有のロゴとして保持する。
  if (name === "leaf") {
    return (
      <svg viewBox="0 0 32 32" className={iconClassName} {...accessibility}>
        <path d="M26 5C14 5 6 12 6 22c0 2 .4 3.6 1 5 6-9 12-12 18-13-5 2.5-9 6.5-12 13 1 .3 2.3.5 4 .5 8 0 13-6 13-15 0-4-1-7-4-8z" />
      </svg>
    );
  }

  const Glyph = glyphs[name];
  return <Glyph className={iconClassName} {...accessibility} />;
}
