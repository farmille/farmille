import { css, cva } from "../../../styled-system/css";

const controlBase = {
  w: "100%",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  bg: "surface.card",
  color: "text.default",
  borderRadius: "input",
  px: "3",
  fontFamily: "sans",
  _placeholder: { color: "text.subtle" },
  _focus: {
    outlineWidth: "1px",
    outlineStyle: "solid",
    outlineColor: "primary.200",
    borderColor: "primary.600",
  },
  _fieldInvalid: { borderColor: "accent.danger" },
  _disabled: { opacity: "disabled", cursor: "not-allowed" },
  // iOS Safari は 16px 未満の入力欄にフォーカスすると画面を拡大する
  _touch: { fontSize: "lg" },
} as const;

const controlSizes = {
  md: { py: "2.5", fontSize: "md" },
  sm: { py: "2", fontSize: "sm" },
} as const;

/** 入力欄の見た目。Select のトリガーや Combobox の入力欄も同じ見た目にそろえる。 */
export const controlRecipe = cva({
  base: controlBase,
  variants: { size: controlSizes },
  defaultVariants: { size: "md" },
});

export const textareaRecipe = cva({
  base: { ...controlBase, ...controlSizes.md, lineHeight: "relaxed", resize: "vertical" },
  variants: {
    size: {
      md: { minH: "84px" },
      lg: { minH: "120px" },
    },
  },
  defaultVariants: { size: "md" },
});

/** Select のトリガー。sm は並び替えのように幅を中身に合わせる。 */
export const selectTriggerRecipe = cva({
  base: {
    ...controlBase,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "2",
    textAlign: "start",
    cursor: "pointer",
  },
  variants: {
    size: {
      md: controlSizes.md,
      // トリガーはボタンなので、フォーカスしても iOS は拡大しない。並び替えなどの小さいトリガーは小さいままにする
      sm: { ...controlSizes.sm, w: "auto", _touch: { fontSize: "sm" } },
    },
  },
  defaultVariants: { size: "md" },
});

/** 縦に積む項目の間隔。見出しを隠した項目（姓・名など）は呼び出し側の行の一部なので、間隔は行に任せる。 */
export const fieldRecipe = cva({
  base: { minW: "0" },
  variants: {
    spacing: { stack: { mt: "5", _first: { mt: "0" } }, none: {} },
  },
  defaultVariants: { spacing: "stack" },
});

export const fieldsetStyle = css({ minW: "0" });

export const labelRowRecipe = cva({
  base: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "2",
    mb: "1.5",
    fontWeight: "bold",
  },
  variants: {
    size: {
      md: { fontSize: "md" },
      sm: { fontSize: "sm", color: "text.muted" },
    },
  },
  defaultVariants: { size: "md" },
});

export const guideRecipe = cva({
  base: { color: "text.muted", fontSize: "sm", lineHeight: "normal" },
  variants: {
    placement: { above: { mb: "2" }, below: { mt: "1.5" } },
  },
});

export const visibilityRecipe = cva({
  base: { display: "inline-flex", alignItems: "center", gap: "1", fontWeight: "bold" },
  variants: {
    visibility: {
      public: { color: "primary.800" },
      private: { color: "text.subtle" },
    },
  },
});

export const fieldErrorStyle = css({
  mt: "1.5",
  color: "accent.danger",
  fontSize: "sm",
  fontWeight: "bold",
  lineHeight: "normal",
});

export const srOnlyStyle = css({ srOnly: true });

/** 隠し input を外に出したときの位置の基準（ネイティブの検証吹き出しが選択肢を指す）。 */
export const choiceItemStyle = css({ position: "relative" });

/** チェックボックス・ラジオの行。チェック状態とフォーカスは中の button の data 属性から拾う。 */
export const choiceRecipe = cva({
  base: {
    display: "flex",
    gap: "2.5",
    fontSize: "md",
    lineHeight: "normal",
    cursor: "pointer",
    _disabled: { opacity: "disabled", cursor: "not-allowed" },
    "&:has(:focus-visible)": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary.700",
      outlineOffset: "2px",
    },
    "& a": { color: "inherit", textDecoration: "underline" },
  },
  variants: {
    look: {
      // 1行目の文字の中心に丸を合わせる
      inline: { alignItems: "flex-start", "& [role=radio]": { mt: "0.5" } },
      row: {
        alignItems: "center",
        px: "3",
        py: "3",
        bg: "surface.card",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
        borderRadius: "input",
        fontWeight: "bold",
        "&:has([data-checked])": { borderColor: "primary.600" },
      },
      // 長い注意書きへの同意。太字の row だと重いので、地の色の枠に控えめな文字で置く
      note: {
        alignItems: "flex-start",
        gap: "2",
        px: "3",
        py: "3",
        bg: "surface.page",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
        borderRadius: "input",
        fontSize: "sm",
        color: "text.muted",
      },
      card: {
        alignItems: "center",
        px: "calc(var(--spacing-3) + var(--spacing-0\\.5) / 2)",
        py: "3",
        bg: "surface.card",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
        borderRadius: "input",
        "&:has([data-checked])": {
          borderColor: "primary.600",
          bg: "primary.100",
          fontWeight: "bold",
        },
      },
      chip: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: "1.5",
        px: "2.5",
        py: "1.5",
        bg: "surface.card",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.default",
        borderRadius: "pill",
        fontSize: "sm",
        "&:has([data-checked])": {
          borderColor: "primary.600",
          bg: "primary.soft",
          color: "primary.700",
        },
      },
    },
    size: { md: {}, sm: { gap: "1.5", fontSize: "sm" } },
    // 写真の削除のように、チェックすると何かを消す選択肢
    tone: { default: {}, danger: { color: "accent.danger" } },
  },
  defaultVariants: { look: "inline", size: "md", tone: "default" },
});

export const choiceGroupRecipe = cva({
  base: { display: "flex" },
  variants: {
    variant: {
      list: { flexDirection: "column", gap: "2.5" },
      cards: { flexDirection: "column", gap: "2" },
      chips: { flexWrap: "wrap", gap: "2" },
    },
  },
});

/** 選択肢の説明。印（box 20px / 丸 18px）と gap の分だけ下げて文字の頭にそろえる。 */
export const choiceDescriptionRecipe = cva({
  base: {
    mt: "0.5",
    color: "text.muted",
    fontSize: "sm",
    lineHeight: "normal",
    _disabled: { opacity: "disabled" },
  },
  variants: {
    mark: { checkbox: { pl: "7.5" }, radio: { pl: "7" } },
  },
});

// 押下の縮みは包む label の行に付く（globals.css）。印の button まで縮むと二重になるので止める
const markPress = { _active: { transform: "none" } } as const;

export const checkboxBoxRecipe = cva({
  base: markPress,
  variants: {
    look: {
      box: {
        display: "grid",
        placeItems: "center",
        flex: "0 0 auto",
        p: "0",
        bg: "surface.card",
        color: "text.inverse",
        borderWidth: "1.5px",
        borderStyle: "solid",
        borderColor: "border.strong",
        borderRadius: "mark",
        cursor: "inherit",
        _checked: { bg: "primary.700", borderColor: "primary.700" },
        _fieldInvalid: { borderColor: "accent.danger" },
      },
      // チップは枠の色でチェック状態を見せるので、印は読み上げ用に残して隠す
      hidden: { srOnly: true },
    },
    size: { md: { w: "5", h: "5" }, sm: { w: "4", h: "4" } },
  },
  defaultVariants: { look: "box", size: "md" },
});

export const checkIndicatorStyle = css({ display: "flex" });

export const radioDotStyle = css({
  ...markPress,
  flex: "0 0 auto",
  w: "4.5",
  h: "4.5",
  p: "0",
  borderRadius: "pill",
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: "border.strong",
  bg: "surface.card",
  cursor: "inherit",
  _checked: {
    borderColor: "primary.600",
    bg: "primary.600",
    boxShadow: "inset 0 0 0 3px {colors.surface.card}",
  },
  _fieldInvalid: { borderColor: "accent.danger" },
});
