import { cva, css } from "../../../../../../styled-system/css";

export { SectionHeading } from "@/components/SectionHeading";

const label = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  mb: "1.5",
  fontSize: "md",
  fontWeight: "700",
  flexWrap: "wrap",
});

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
      true: { bg: "primary.700", color: "surface.card" },
      false: { bg: "surface.page", color: "text.subtle" },
    },
  },
});

const fieldError = css({
  mt: "1.5",
  fontSize: "sm",
  color: "accent.danger",
  fontWeight: "600",
  lineHeight: "1.45",
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
    <label className={label} htmlFor={htmlFor}>
      {children}
      <span className={badge({ required: required === true })}>{required ? "必須" : "任意"}</span>
    </label>
  );
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  return message ? (
    <p id={id} className={fieldError} role="alert">
      {message}
    </p>
  ) : null;
}
