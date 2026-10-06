import type { ReactNode } from "react";
import { css } from "../../styled-system/css";

export function PageNotice({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section aria-label={title} className={css({ py: "5", maxW: "content.form", mx: "auto" })}>
      <h1
        className={css({
          m: "0",
          color: "text.default",
          fontSize: "lg",
          fontWeight: "800",
          lineHeight: "normal",
        })}
      >
        {title}
      </h1>
      <p className={css({ mt: "3", color: "text.muted", fontSize: "sm", lineHeight: "relaxed" })}>
        {description}
      </p>
      {children ? <div className={css({ mt: "6" })}>{children}</div> : null}
    </section>
  );
}
