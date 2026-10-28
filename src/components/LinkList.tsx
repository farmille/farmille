import Link from "next/link";
import { useId } from "react";

import { css } from "../../styled-system/css";
import { Icon } from "./Icon";
import { surfaceCardRecipe } from "./SurfaceCard";

export type LinkListItem = {
  href: string;
  label: string;
  /** 行の下に小さく添える今の状態（登録内容の要約など）。 */
  detail?: string;
};

type LinkListProps = {
  title: string;
  /** 見出しの下、枠の外に置く補足。 */
  description?: string;
  items: readonly LinkListItem[];
};

const heading = css({ m: "0", color: "text.default", textStyle: "title" });

const lead = css({ mt: "1.5", mb: "0", color: "text.muted", textStyle: "supporting" });

const frame = css(surfaceCardRecipe.raw({ padding: "flush" }), {
  mt: "3",
  mb: "0",
  p: "0",
  listStyle: "none",
  overflow: "hidden",
});

const row = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  minH: "14",
  px: "4",
  py: "3",
  color: "text.default",
  textDecoration: "none",
  _hover: { bg: "primary.soft" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    outlineOffset: "[-2px]",
  },
});

const divider = css({
  "& + &": { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: "border.default" },
});

const texts = css({ display: "flex", flexDirection: "column", gap: "0.5", flex: "1", minW: "0" });

const label = css({ textStyle: "body", fontWeight: "bold" });

const detailText = css({ color: "text.muted", textStyle: "supporting", overflowWrap: "anywhere" });

const chevron = css({ flexShrink: "0", color: "text.subtle" });

/** 見出しと枠で区切った、行全体が押せるリンクの一覧。設定画面の項目に使う。 */
export function LinkList({ title, description, items }: LinkListProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <h2 className={heading} id={headingId}>
        {title}
      </h2>
      {description === undefined ? null : <p className={lead}>{description}</p>}
      <ul className={frame}>
        {items.map((item) => (
          <li className={divider} key={item.href}>
            <Link className={row} href={item.href}>
              <span className={texts}>
                <span className={label}>{item.label}</span>
                {item.detail === undefined ? null : (
                  <span className={detailText}>{item.detail}</span>
                )}
              </span>
              <Icon className={chevron} name="chevron_right" size="md" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
