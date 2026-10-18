import { cva, cx, type RecipeVariantProps } from "../../styled-system/css";

// Google Material Icons（material-icons パッケージのフォント）を用途名で参照する。
// Material Icons の線版は書体（Outlined）で出し分けるが、bookmark・star のように
// 塗りと線が別名（*_border）の glyph は ligature 名で出し分ける。書体は glyph ごとに固定する。
const glyphs = {
  search: { ligature: "search", face: "filled" },
  bookmark: { ligature: "bookmark_border", face: "outlined" },
  bookmark_filled: { ligature: "bookmark", face: "filled" },
  visibility: { ligature: "visibility", face: "outlined" },
  visibility_off: { ligature: "visibility_off", face: "outlined" },
  chevron_left: { ligature: "chevron_left", face: "filled" },
  share: { ligature: "share", face: "filled" },
  verified: { ligature: "verified", face: "outlined" },
  person: { ligature: "person", face: "outlined" },
  thumb_up: { ligature: "thumb_up", face: "outlined" },
  chevron_right: { ligature: "chevron_right", face: "filled" },
  expand_more: { ligature: "expand_more", face: "filled" },
  home: { ligature: "home", face: "outlined" },
  article: { ligature: "article", face: "outlined" },
  add: { ligature: "add", face: "filled" },
  image: { ligature: "image", face: "outlined" },
  check: { ligature: "check", face: "filled" },
  arrow_forward: { ligature: "arrow_forward", face: "filled" },
  arrow_back: { ligature: "arrow_back", face: "filled" },
  arrow_downward: { ligature: "arrow_downward", face: "filled" },
  north_east: { ligature: "north_east", face: "filled" },
  close: { ligature: "close", face: "filled" },
  star: { ligature: "star_border", face: "filled" },
  star_filled: { ligature: "star", face: "filled" },
  public: { ligature: "language", face: "outlined" },
  lock: { ligature: "lock", face: "outlined" },
  open_in_new: { ligature: "open_in_new", face: "filled" },
  location_on: { ligature: "location_on", face: "outlined" },
  eco: { ligature: "eco", face: "outlined" },
  warning: { ligature: "warning", face: "filled" },
  edit: { ligature: "edit", face: "outlined" },
} as const;

// 一辺 = フォントサイズ。フォント読み込み前に ligature の文字列で幅が広がらないよう箱を固定して切り取る。
const iconRecipe = cva({
  base: {
    display: "inline-block",
    flexShrink: "0",
    verticalAlign: "middle",
    overflow: "hidden",
    lineHeight: "1",
    letterSpacing: "normal",
    textTransform: "none",
    whiteSpace: "nowrap",
    direction: "ltr",
    fontStyle: "normal",
    fontWeight: "normal",
    fontFeatureSettings: '"liga"',
    userSelect: "none",
    // ligature 名は属性から疑似要素で描き、本文テキスト（getByText・検索エンジン・コピー）に混ぜない。
    _before: { content: "attr(data-icon)" },
    fontSmoothing: "antialiased",
  },
  variants: {
    size: {
      "2xs": { width: "icon.2xs", height: "icon.2xs", fontSize: "token(sizes.icon.2xs)" },
      xs: { width: "icon.xs", height: "icon.xs", fontSize: "token(sizes.icon.xs)" },
      sm: { width: "icon.sm", height: "icon.sm", fontSize: "token(sizes.icon.sm)" },
      md: { width: "icon.md", height: "icon.md", fontSize: "token(sizes.icon.md)" },
      lg: { width: "icon.lg", height: "icon.lg", fontSize: "token(sizes.icon.lg)" },
      xl: { width: "icon.xl", height: "icon.xl", fontSize: "token(sizes.icon.xl)" },
      "2xl": { width: "icon.2xl", height: "icon.2xl", fontSize: "token(sizes.icon.2xl)" },
    },
    face: {
      filled: { fontFamily: "materialIcons" },
      outlined: { fontFamily: "materialIconsOutlined" },
    },
  },
  defaultVariants: { size: "md" },
});

export type IconName = keyof typeof glyphs;
/** 利用できる glyph 名の一覧（Storybook の全件表示用）。 */
export const iconNames = Object.keys(glyphs).filter((name): name is IconName => name in glyphs);
export type IconProps = Pick<NonNullable<RecipeVariantProps<typeof iconRecipe>>, "size"> & {
  name: IconName;
  className?: string;
  /** 単独で意味を伝える場合の読み上げ名。装飾アイコンでは省略する。 */
  label?: string;
};

/** サイズをトークンで指定するアイコン。色は親要素から継承する。 */
export function Icon({ name, size, className, label }: IconProps) {
  const { ligature, face } = glyphs[name];
  return (
    <span
      className={cx(iconRecipe({ size, face }), className)}
      data-icon={ligature}
      translate="no"
      aria-hidden={label === undefined ? true : undefined}
      role={label === undefined ? undefined : "img"}
      aria-label={label}
    />
  );
}
