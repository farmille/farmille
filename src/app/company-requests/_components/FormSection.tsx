import type { ReactNode } from "react";

import { css } from "../../../../styled-system/css";

const headingStyle = css({
  mt: "10",
  pt: "6.5",
  borderTopWidth: "2px",
  borderTopStyle: "solid",
  borderTopColor: "accent.manufacturer/30",
  fontSize: "3xl",
  fontWeight: "extrabold",
  letterSpacing: "0.02em",
});

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className={headingStyle}>{title}</h2>
      <div className={css({ mt: "3.5" })}>{children}</div>
    </section>
  );
}
