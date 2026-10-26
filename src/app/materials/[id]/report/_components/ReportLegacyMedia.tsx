"use client";

import { Button } from "@/components/Button";
import { OptimizedImage } from "@/components/OptimizedImage";
import { REPORT_SECTIONS, type UsageReportInput } from "@/lib/usage-report";

import { css } from "../../../../../../styled-system/css";

import { docHeadingRecipe, docLead } from "./report-page-styles";

const list = css({ display: "grid", gap: "3", m: "0", mt: "3", p: "0", listStyleType: "none" });

const card = css({
  p: "2.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  "& :is(img, video)": {
    display: "block",
    w: "full",
    h: "auto",
    maxH: "64",
    objectFit: "contain",
    bg: "surface.panel",
    borderRadius: "input",
  },
});

const where = css({ m: "0", mt: "2", textStyle: "supporting", color: "text.muted" });

const caption = css({ m: "0", mt: "0.5", textStyle: "body", color: "text.default" });

const remove = css({ mt: "2" });

/**
 * 以前の入力画面で節ごとに添えた写真・動画。ページ版の本文には置き場が無いが、公開記事では
 * 添えた節の最後に出るので、投稿の前にここで確かめて消せるようにする。
 */
export function ReportLegacyMedia({
  media,
  onRemove,
}: {
  media: UsageReportInput["media"];
  onRemove: (id: string) => void;
}) {
  if (media.length === 0) return null;
  return (
    <>
      <h2 className={docHeadingRecipe()} id="report-legacy-media">
        以前の形式の写真
      </h2>
      <p className={docLead}>
        以前の入力画面で各欄に添えた写真・動画です。公開する記事では、添えた欄の最後に出ます。載せないものは削除してください。
      </p>
      <ul className={list}>
        {media.map((item, index) => {
          const section = REPORT_SECTIONS.find(({ value }) => value === item.section)?.title;
          const label =
            item.caption || `${index + 1}件目の${item.mediaType === "photo" ? "写真" : "動画"}`;
          return (
            <li key={item.id} className={card}>
              {item.mediaType === "photo" ? (
                <OptimizedImage
                  src={item.url}
                  alt={label}
                  width={720}
                  height={540}
                  sizes="(max-width: 720px) 100vw, 720px"
                />
              ) : (
                <video src={item.url} controls aria-label={label} />
              )}
              <p className={where}>添えた欄：{section}</p>
              {item.caption && <p className={caption}>{item.caption}</p>}
              <Button
                variant="danger"
                size="sm"
                className={remove}
                aria-label={`${label}を削除`}
                onClick={() => onRemove(item.id)}
              >
                削除
              </Button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
