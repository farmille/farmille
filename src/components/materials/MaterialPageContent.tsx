import { MaterialRegistrationBadges } from "./MaterialRegistrationBadges";
import { MaterialIllustration } from "./MaterialIllustration";
import { MaterialLinks } from "./MaterialLinks";
import {
  APPLICATION_METHODS,
  materialRegistrationRows,
  APPLICATION_TIMINGS,
  type MaterialPageContent as Content,
} from "@/lib/material-page-editor";
import { css } from "../../../styled-system/css";

export const materialPageStack = css({
  display: "flex",
  flexDirection: "column",
  gap: "6",
  minW: "0",
  textStyle: "body",
  "& h2": { textStyle: "title", mb: "3" },
  "& h3": { textStyle: "body", fontWeight: "bold", mt: "3", mb: "2" },
  "& > section": { pb: "5", borderBottomWidth: "1px", borderBottomColor: "border.default" },
  "& a": { overflowWrap: "anywhere" },
  // 色は原稿の素の要素にだけ付け、カードやリンク部品が自分で決めた色を上書きしない
  "& h2:not([class]), & a:not([class])": { color: "primary.700" },
});
export const materialPageText = css({
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  textStyle: "prose",
});
/** メーカー原稿の本文と資料をプレビューする。 */
export function MaterialPageContent({
  content,
  imageUrl,
}: {
  content: Content;
  imageUrl: string | null;
}) {
  return (
    <div className={materialPageStack}>
      <section>
        <h2>製品画像</h2>
        <MaterialIllustration imageUrl={imageUrl} />
      </section>
      <section>
        <h2>製品説明</h2>
        <p className={materialPageText}>{content.description || "−"}</p>
      </section>
      <section>
        <h2>施用タイミング</h2>
        <p>{content.timings.map((timing) => APPLICATION_TIMINGS[timing]).join(" ／ ") || "−"}</p>
      </section>
      <MaterialLinks links={content.links} />
      <section>
        <h2>施用方法</h2>
        {content.usages.length === 0 ? <p>−</p> : null}
        {content.usages.map((usage, index) =>
          usage.method === "other" ? (
            <p key={index}>その他</p>
          ) : (
            <details key={index}>
              <summary>
                {APPLICATION_METHODS.find((method) => method.value === usage.method)?.label}
              </summary>
              <p className={materialPageText}>{usage.detail || "−"}</p>
            </details>
          ),
        )}
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
        <MaterialRegistrationBadges
          registrations={content.registrations}
          certifications={content.certifications}
        />
        <dl>
          {materialRegistrationRows(content.registrations).map((entry) => (
            <div key={entry.label}>
              <dt className={css({ fontWeight: "bold", mt: "3" })}>{entry.label}</dt>
              <dd className={materialPageText}>{entry.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section>
        <h2>関係会社（販売元、製造元、輸入元など）</h2>
        <p className={materialPageText}>{content.relatedCompanies.join("、") || "−"}</p>
      </section>
    </div>
  );
}
