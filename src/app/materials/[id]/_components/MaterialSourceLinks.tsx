import { Icon } from "@/components/Icon";
import { useId } from "react";
import * as v from "valibot";

import {
  MATERIAL_LINK_GROUPS,
  MaterialExternalUrlSchema,
  type MaterialPageContent,
} from "@/lib/material-page-editor";

import { surfaceCardRecipe } from "@/components/SurfaceCard";

import { css, cx } from "../../../../../styled-system/css";

import { MaterialBox } from "./MaterialBox";

type MaterialLink = MaterialPageContent["links"][number];
type LinkGroup = MaterialLink["group"];

const cardStyle = css(surfaceCardRecipe.raw({ padding: "flush" }), {
  pt: "1.5",
  px: "3.5",
  pb: "2.5",
});
const groupTitleStyle = css({
  pt: "2",
  px: "0.5",
  pb: "0.5",
  textStyle: "body",
  fontWeight: "bold",
  color: "text.subtle",
});
const emptyStyle = css({
  pt: "1",
  px: "0.5",
  pb: "2",
  textStyle: "supporting",
  color: "text.subtle",
});
const kindStyle = css({
  flex: "none",
  px: "1",
  py: "1",
  fontSize: "2xs",
  fontWeight: "extrabold",
  color: "accent.danger",
  bg: "accent.danger/14",
  borderRadius: "mark",
});
const fileRowStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  px: "3",
  py: "2.5",
  borderBottomWidth: "1px",
  borderColor: "border.default",
  _last: { borderBottomWidth: "0" },
});
const fileTitleBoxStyle = css({ flex: "1", minW: "0", overflowWrap: "anywhere" });
const fileTitleStyle = css({ fontSize: "sm", fontWeight: "semibold", lineHeight: "snug" });
const openLinkStyle = css({
  flex: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  p: "1",
  fontSize: "sm",
  fontWeight: "bold",
  color: "text.brand",
  textDecoration: "none",
  whiteSpace: "nowrap",
});
const testRowStyle = css({
  display: "flex",
  alignItems: "flex-start",
  gap: "2.5",
  px: "0.5",
  py: "2.5",
  color: "inherit",
  textDecoration: "none",
  borderTopWidth: "1px",
  borderColor: "border.default",
  _first: { borderTopWidth: "0" },
});
const testKindStyle = css({ mt: "0.5" });
const testBodyStyle = css({ flex: "1", minW: "0" });
const testTitleStyle = css({
  fontSize: "md",
  fontWeight: "bold",
  lineHeight: "snug",
  color: "text.default",
  _groupHover: {
    color: "text.brand",
    textDecoration: "underline",
    textUnderlineOffset: "2px",
  },
});
const testSummaryStyle = css({
  mt: "0.5",
  textStyle: "supporting",
  color: "text.muted",
  lineClamp: "2",
});
const testMetaStyle = css({ mt: "1", textStyle: "note", color: "text.subtle" });
const testOpenStyle = css({
  flex: "none",
  alignSelf: "center",
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  px: "2.5",
  py: "1",
  fontSize: "xs",
  fontWeight: "bold",
  color: "text.brand",
  whiteSpace: "nowrap",
  bg: "surface.card",
  borderWidth: "1px",
  borderColor: "border.strong",
  borderRadius: "pill",
});

function linkKind(url: string): "PDF" | "LINK" {
  return /\.pdf(?:$|[?#])/i.test(url) ? "PDF" : "LINK";
}

function FileRow({ link }: { link: MaterialLink }) {
  const titleId = useId();
  const title = link.title || "資料名は未入力です";
  const valid = v.is(MaterialExternalUrlSchema, link.url);
  return (
    <div className={fileRowStyle}>
      <span className={kindStyle}>{linkKind(link.url)}</span>
      <div className={fileTitleBoxStyle}>
        <div className={fileTitleStyle} id={titleId}>
          {valid ? title : `${title}（URLを入力してください）`}
        </div>
      </div>
      {valid ? (
        <a
          className={openLinkStyle}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          aria-labelledby={titleId}
        >
          <Icon name="open_in_new" size="2xs" />
          開く
        </a>
      ) : null}
    </div>
  );
}

function TestRow({ link }: { link: MaterialLink }) {
  const titleId = useId();
  const title = link.title || "資料名は未入力です";
  const trial = link.trial;
  const meta = [
    trial?.institution,
    trial?.year === null || trial?.year === undefined ? "" : `${trial.year}年`,
    trial?.pageCount === null || trial?.pageCount === undefined ? "" : `${trial.pageCount}ページ`,
  ].filter(Boolean);
  const body = (
    <>
      <span className={cx(kindStyle, testKindStyle)}>{linkKind(link.url)}</span>
      <div className={testBodyStyle}>
        <div className={testTitleStyle}>
          <span id={titleId}>{title}</span>
          {trial?.crops ? `｜${trial.crops}` : ""}
        </div>
        <div className={testSummaryStyle}>{trial?.summary || "概要は未入力です"}</div>
        {meta.length > 0 ? (
          <div className={testMetaStyle}>
            {meta.map((item, index) => (
              <span key={index}>
                {index > 0 ? "・" : null}
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
  if (!v.is(MaterialExternalUrlSchema, link.url)) {
    return (
      <div className={testRowStyle}>
        {body}
        <span className={testOpenStyle}>URL未入力</span>
      </div>
    );
  }
  return (
    <a
      className={cx("group", testRowStyle)}
      href={link.url}
      target="_blank"
      rel="noreferrer"
      aria-labelledby={titleId}
    >
      {body}
      <span className={testOpenStyle}>
        <Icon name="open_in_new" size="2xs" /> 開く
      </span>
    </a>
  );
}

function isTrialGroup(group: LinkGroup): boolean {
  return group === "public_trial" || group === "other_trial";
}

export function MaterialSourceLinks({ links }: { links: MaterialPageContent["links"] }) {
  const groups: ReadonlyArray<{ value: LinkGroup; label: string }> = [
    ...MATERIAL_LINK_GROUPS,
    ...(links.some((link) => link.group === null) ? [{ value: null, label: "分類未選択" }] : []),
  ];
  return (
    <MaterialBox headingId="material-links-heading" title="リンク・資料">
      <div className={cardStyle}>
        {groups.map((group) => {
          const items = links.filter((link) => link.group === group.value);
          const trial = isTrialGroup(group.value);
          return (
            <div key={group.value ?? "unclassified"}>
              <h3 className={groupTitleStyle}>{group.label}</h3>
              {items.length === 0 ? (
                <div className={emptyStyle}>−</div>
              ) : trial ? (
                <div>
                  {items.map((link, index) => (
                    <TestRow key={index} link={link} />
                  ))}
                </div>
              ) : (
                items.map((link, index) => <FileRow key={index} link={link} />)
              )}
            </div>
          );
        })}
      </div>
    </MaterialBox>
  );
}
