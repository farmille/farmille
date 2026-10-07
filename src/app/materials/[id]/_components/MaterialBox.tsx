import type { ReactNode } from "react";

import { css } from "../../../../../styled-system/css";

const sectionStyle = css({ pt: "6" });
const headingStyle = css({
  pb: "2",
  fontSize: "md",
  fontWeight: "extrabold",
  color: "text.muted",
  letterSpacing: "0.02em",
});

export function MaterialBox({
  headingId,
  title,
  children,
}: {
  headingId: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={headingId} className={sectionStyle}>
      <h2 id={headingId} className={headingStyle}>
        {title}
      </h2>
      {children}
    </section>
  );
}
