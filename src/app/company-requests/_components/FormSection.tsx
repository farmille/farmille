import type { ReactNode } from "react";

/** 見本 section()：`.form-sec`（番号・見出し）と、その下の本文。 */
export function FormSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title}>
      <div className="form-sec">
        <span className="no" aria-hidden="true">
          {number}
        </span>
        <h2>{title}</h2>
      </div>
      <div style={{ marginTop: 14 }}>{children}</div>
    </section>
  );
}
