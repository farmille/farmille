import { cva, css, cx } from "../../../../../../styled-system/css";
import { CheckIcon } from "@/components/icons";

export const formStyles = {
  field: css({ mt: "5" }),
  firstField: css({ mt: "0" }),
  label: css({
    display: "flex",
    alignItems: "center",
    gap: "2",
    mb: "1.5",
    fontSize: "md",
    fontWeight: "700",
    flexWrap: "wrap",
  }),
  guide: css({
    mb: "2",
    fontSize: "sm",
    color: "text.muted",
    lineHeight: "1.55",
  }),
  conditionHeading: css({
    mt: "7",
    mb: "-1",
    pl: "0.5",
    fontSize: "sm",
    fontWeight: "800",
    color: "text.subtle",
    letterSpacing: "0.05em",
  }),
  panel: css({
    mt: "3",
    pl: "3",
    borderLeftWidth: "2px",
    borderLeftStyle: "solid",
    borderLeftColor: "brand.soft",
  }),
  row: css({ display: "flex", gap: "2" }),
  grow: css({ flex: "1", minW: "0" }),
  unit: css({ flex: "0 0 42%" }),
  tagCloud: css({ display: "flex", flexWrap: "wrap", gap: "1.5" }),
};

const badge = cva({
  base: {
    borderRadius: "pill",
    px: "2",
    py: "0.5",
    fontSize: "2xs",
    fontWeight: "700",
  },
  variants: {
    required: {
      true: { bg: "brand.primary", color: "surface.card" },
      false: { bg: "surface.page", color: "text.subtle" },
    },
  },
});

const section = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  mt: "7.5",
  pt: "5",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
});

const sectionFirst = css({ mt: "1.5", pt: "3.5", borderTopWidth: "0" });

const sectionNumber = css({
  w: "5.5",
  h: "5.5",
  borderRadius: "pill",
  bg: "brand.primary",
  color: "surface.card",
  display: "grid",
  placeItems: "center",
  flexShrink: "0",
  fontSize: "xs",
  fontWeight: "800",
});

const sectionTitle = css({ m: "0", fontSize: "lg", fontWeight: "700" });
const sectionSub = css({
  ml: "auto",
  fontSize: "xs",
  color: "text.subtle",
  textAlign: "right",
});

const fieldError = css({
  mt: "1.5",
  fontSize: "sm",
  color: "accent.danger",
  fontWeight: "600",
  lineHeight: "1.45",
});

export const choiceButton = cva({
  base: {
    w: "100%",
    display: "flex",
    alignItems: "center",
    gap: "2.5",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "input",
    px: "3",
    py: "3",
    fontSize: "md",
    textAlign: "left",
    cursor: "pointer",
  },
  variants: {
    selected: {
      true: {
        borderColor: "brand.primary",
        bg: "green.soft2",
        color: "text.default",
        fontWeight: "700",
      },
      false: {
        borderColor: "border.default",
        bg: "surface.card",
        color: "text.default",
      },
    },
  },
});

export const choiceList = css({ display: "flex", flexDirection: "column", gap: "2" });

const choiceRing = cva({
  base: {
    w: "4.5",
    h: "4.5",
    borderRadius: "pill",
    borderWidth: "2px",
    borderStyle: "solid",
    flexShrink: "0",
  },
  variants: {
    selected: {
      true: {
        borderColor: "brand.primary",
        bg: "brand.primary",
        boxShadow: "inset 0 0 0 4px var(--colors-surface-card)",
      },
      false: { borderColor: "border.strong", bg: "surface.card" },
    },
  },
});

export const tagButton = cva({
  base: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "pill",
    px: "2.5",
    py: "1.5",
    fontSize: "sm",
    cursor: "pointer",
  },
  variants: {
    selected: {
      true: {
        bg: "brand.primary",
        borderColor: "brand.primary",
        color: "surface.card",
        fontWeight: "600",
      },
      false: {
        bg: "surface.card",
        borderColor: "border.default",
        color: "text.muted",
      },
    },
  },
});

const toggleButton = cva({
  base: {
    w: "100%",
    display: "flex",
    alignItems: "center",
    gap: "2.5",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "input",
    bg: "surface.card",
    px: "3",
    py: "3",
    fontSize: "md",
    fontWeight: "700",
    textAlign: "left",
    cursor: "pointer",
  },
});

const checkBox = cva({
  base: {
    w: "5",
    h: "5",
    borderRadius: "button",
    borderWidth: "1.5px",
    borderStyle: "solid",
    flexShrink: "0",
    display: "grid",
    placeItems: "center",
  },
  variants: {
    checked: {
      true: {
        bg: "brand.primary",
        borderColor: "brand.primary",
        color: "surface.card",
      },
      false: {
        bg: "surface.card",
        borderColor: "border.strong",
        color: "transparent",
      },
    },
  },
});

export function FieldLabel({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label className={formStyles.label} htmlFor={htmlFor}>
      {children}
      <span className={badge({ required: required === true })}>{required ? "必須" : "任意"}</span>
    </label>
  );
}

export function SectionHeading({
  number,
  title,
  sub,
  first = false,
}: {
  number: string;
  title: string;
  sub?: string;
  first?: boolean;
}) {
  return (
    <div className={cx(section, first && sectionFirst)}>
      <span className={sectionNumber}>{number}</span>
      <h2 className={sectionTitle}>{title}</h2>
      {sub ? <span className={sectionSub}>{sub}</span> : null}
    </div>
  );
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  return message ? (
    <p id={id} className={fieldError} role="alert">
      {message}
    </p>
  ) : null;
}

export function Choice({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={choiceButton({ selected })}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className={choiceRing({ selected })} aria-hidden />
      {children}
    </button>
  );
}

export function TogglePanel({
  checked,
  label,
  optional = true,
  onChange,
  children,
}: {
  checked: boolean;
  label: string;
  optional?: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={formStyles.field}>
      <button
        type="button"
        className={toggleButton()}
        aria-expanded={checked}
        onClick={() => onChange(!checked)}
      >
        <span className={checkBox({ checked })} aria-hidden>
          <CheckIcon size={14} />
        </span>
        <span>{label}</span>
        {optional ? (
          <span className={cx(badge({ required: false }), css({ ml: "auto" }))}>任意</span>
        ) : null}
      </button>
      {checked ? <div className={formStyles.panel}>{children}</div> : null}
    </div>
  );
}

export function ConsentCheck({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}) {
  const consent = cva({
    base: {
      mt: "5",
      w: "100%",
      display: "flex",
      alignItems: "flex-start",
      gap: "2.5",
      borderWidth: "1px",
      borderStyle: "solid",
      borderRadius: "input",
      p: "3",
      bg: "surface.page",
      fontSize: "sm",
      color: "text.muted",
      lineHeight: "1.55",
      textAlign: "left",
      cursor: "pointer",
    },
    variants: {
      invalid: {
        true: { borderColor: "accent.danger" },
        false: { borderColor: "border.default" },
      },
    },
  });

  return (
    <>
      <button
        type="button"
        className={consent({ invalid: error !== undefined })}
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
      >
        <span className={checkBox({ checked })} aria-hidden>
          <CheckIcon size={14} />
        </span>
        <span>
          この使用結果には、病害虫の防除、殺菌・殺虫、農薬の代替など、農薬的な効果を断定する表現を含めていません
          <span className={css({ color: "accent.danger" })}> ＊</span>
        </span>
      </button>
      <FieldError message={error} />
    </>
  );
}
