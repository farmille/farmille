import {
  IconAdjustmentsHorizontal,
  IconArrowBackUp,
  IconAlertTriangle,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUpRight,
  IconArticle,
  IconBookmark,
  IconBookmarkFilled,
  IconCheck,
  IconCheckbox,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCircleX,
  IconCrop,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconFileTypePdf,
  IconHome,
  IconInfoCircle,
  IconLeaf,
  IconLoader2,
  IconLock,
  IconMapPin,
  IconMenu2,
  IconPaint,
  IconPencil,
  IconPhoto,
  IconPlus,
  IconRosetteDiscountCheck,
  IconRotate,
  IconRotateClockwise,
  IconSearch,
  IconShare2,
  IconStar,
  IconStarFilled,
  IconThumbUp,
  IconUser,
  IconWorld,
  IconX,
} from "@tabler/icons-react";
import { cva, cx, type RecipeVariantProps } from "../../styled-system/css";

const glyphs = {
  search: IconSearch,
  menu: IconMenu2,
  tune: IconAdjustmentsHorizontal,
  bookmark: IconBookmark,
  bookmark_filled: IconBookmarkFilled,
  visibility: IconEye,
  visibility_off: IconEyeOff,
  chevron_left: IconChevronLeft,
  share: IconShare2,
  verified: IconRosetteDiscountCheck,
  person: IconUser,
  thumb_up: IconThumbUp,
  chevron_right: IconChevronRight,
  expand_more: IconChevronDown,
  home: IconHome,
  article: IconArticle,
  add: IconPlus,
  image: IconPhoto,
  check: IconCheck,
  check_box: IconCheckbox,
  arrow_forward: IconArrowRight,
  arrow_back: IconArrowLeft,
  arrow_downward: IconArrowDown,
  north_east: IconArrowUpRight,
  close: IconX,
  rotate_left: IconRotate,
  rotate_right: IconRotateClockwise,
  crop: IconCrop,
  format_color_fill: IconPaint,
  undo: IconArrowBackUp,
  picture_as_pdf: IconFileTypePdf,
  star: IconStar,
  star_filled: IconStarFilled,
  public: IconWorld,
  lock: IconLock,
  open_in_new: IconExternalLink,
  location_on: IconMapPin,
  eco: IconLeaf,
  warning: IconAlertTriangle,
  edit: IconPencil,
  info: IconInfoCircle,
  error: IconCircleX,
  loader: IconLoader2,
};

const iconRecipe = cva({
  base: {
    display: "inline-block",
    flexShrink: "0",
    verticalAlign: "middle",
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

export type IconName = keyof typeof glyphs;

/** 利用できるアイコン名の一覧（Storybook の全件表示用）。 */
export const iconNames = Object.keys(glyphs).filter((name): name is IconName => name in glyphs);

export type IconProps = Pick<NonNullable<RecipeVariantProps<typeof iconRecipe>>, "size"> & {
  name: IconName;
  className?: string;
  /** 単独で意味を伝える場合の読み上げ名。装飾アイコンでは省略する。 */
  label?: string;
};

/** サイズをトークンで指定するアイコン。色は親要素から継承する。 */
export function Icon({ name, size, className, label }: IconProps) {
  const Glyph = glyphs[name];

  return (
    <Glyph
      className={cx(iconRecipe({ size }), className)}
      data-icon={name}
      focusable="false"
      aria-hidden={label === undefined ? true : undefined}
      role={label === undefined ? undefined : "img"}
      aria-label={label}
    />
  );
}
