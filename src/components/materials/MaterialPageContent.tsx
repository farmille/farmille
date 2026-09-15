import Image from "next/image";
import * as v from "valibot";
import {
  APPLICATION_METHODS,
  APPLICATION_TIMINGS,
  MATERIAL_LINK_GROUPS,
  MaterialExternalUrlSchema,
  type MaterialPageContent as Content,
} from "@/lib/material-page-editor";
import { css } from "../../../styled-system/css";

export const materialPageStack = css({
  display: "flex",
  flexDirection: "column",
  gap: "6",
  minW: "0",
  fontSize: "sm",
  lineHeight: "relaxed",
  "& h2": { fontSize: "lg", fontWeight: "700", color: "brand.primaryDeep", mb: "3" },
  "& h3": { fontSize: "sm", fontWeight: "700", mt: "3", mb: "2" },
  "& > section": { pb: "5", borderBottomWidth: "1px", borderBottomColor: "border.default" },
  "& a": { color: "brand.primary", overflowWrap: "anywhere" },
});
export const materialPageText = css({
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  lineHeight: "relaxed",
  fontSize: "sm",
});
export const materialPageImages = css({ display: "flex", gap: "3", flexWrap: "wrap" });
const imageFrame = css({
  position: "relative",
  w: "imagePreview",
  h: "imagePreview",
  borderRadius: "card",
  overflow: "hidden",
  borderWidth: "1px",
  borderColor: "border.default",
});

/** 公開ページと原稿プレビューで同じ本文表示を使う。 */
export function MaterialPageContent({
  content,
  imageSources,
}: {
  content: Content;
  imageSources: string[];
}) {
  return (
    <div className={materialPageStack}>
      <section>
        <h2>製品画像</h2>
        <div className={materialPageImages}>
          {content.images.map((entry, index) => (
            <div className={imageFrame} key={entry.path}>
              <Image
                unoptimized
                src={imageSources[index]}
                alt={entry.alt || "製品画像"}
                fill
                sizes="160px"
                className={css({ objectFit: "contain" })}
              />
            </div>
          ))}
          {content.images.length === 0 ? <p>画像は未登録です</p> : null}
        </div>
      </section>
      <section>
        <h2>製品説明</h2>
        <p className={materialPageText}>{content.description || "−"}</p>
      </section>
      <section>
        <h2>施用タイミング</h2>
        <p>{content.timings.map((timing) => APPLICATION_TIMINGS[timing]).join(" ／ ") || "−"}</p>
      </section>
      <section>
        <h2>リンク・資料</h2>
        {MATERIAL_LINK_GROUPS.map((group) => (
          <div key={group.value}>
            <h3>{group.label}</h3>
            {content.links.filter((link) => link.group === group.value).length === 0 ? (
              <p>−</p>
            ) : null}
            {content.links
              .filter((link) => link.group === group.value)
              .map((link) => (
                <p key={`${link.group}-${link.url}-${link.title}`}>
                  {v.is(MaterialExternalUrlSchema, link.url) ? (
                    <a href={link.url} target="_blank" rel="noreferrer">
                      {link.title || "資料名は未入力です"}
                    </a>
                  ) : (
                    <span>{link.title || "資料名は未入力です"}（URLを入力してください）</span>
                  )}
                </p>
              ))}
          </div>
        ))}
      </section>
      <section>
        <h2>施用方法</h2>
        {content.usages.length === 0 ? <p>−</p> : null}
        {content.usages.map((usage, index) => (
          <details key={index} open>
            <summary>
              {APPLICATION_METHODS.find((method) => method.value === usage.method)?.label}
            </summary>
            <p className={materialPageText}>{usage.detail || "−"}</p>
          </details>
        ))}
      </section>
      <section>
        <h2>製品詳細</h2>
        <h3>主な成分</h3>
        <p className={materialPageText}>{content.mainComponents || "−"}</p>
        <h3>作用機作</h3>
        <p className={materialPageText}>{content.mechanism || "−"}</p>
      </section>
      <section>
        <h2>登録・認証</h2>
        {content.certifications.length === 0 ? (
          <p>−</p>
        ) : (
          <ul>
            {content.certifications.map((title, index) => (
              <li key={index}>{title}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
