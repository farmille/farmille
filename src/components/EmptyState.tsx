import { cva, css, cx } from "../../styled-system/css";

const wrapRecipe = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: "2",
    py: "10",
    px: "4",
    color: "text.subtle",
  },
});

type EmptyStateProps = {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

/** 空状態。「まだ投稿がありません」等。 */
export function EmptyState({
  title = "まだ投稿がありません",
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx(wrapRecipe(), className)}>
      <p className={css({ textStyle: "body", fontWeight: "bold", color: "text.muted", m: "0" })}>
        {title}
      </p>
      {description ? (
        <p className={css({ textStyle: "supporting", m: "0", maxW: "280px" })}>{description}</p>
      ) : null}
      {children}
    </div>
  );
}
