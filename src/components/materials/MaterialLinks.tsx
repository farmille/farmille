import * as v from "valibot";
import {
  MATERIAL_LINK_GROUPS,
  MaterialExternalUrlSchema,
  type MaterialPageContent,
} from "@/lib/material-page-editor";
import { css } from "../../../styled-system/css";

export function MaterialLinks({ links }: { links: MaterialPageContent["links"] }) {
  return (
    <section aria-label="リンク・資料">
      <h2 className={css({ textStyle: "title", mb: "3" })}>リンク・資料</h2>
      {[
        ...MATERIAL_LINK_GROUPS,
        ...(links.some((link) => link.group === null)
          ? [{ value: null, label: "分類未選択" }]
          : []),
      ].map((group) => {
        const items = links.filter((link) => link.group === group.value);
        return (
          <div key={group.value ?? "unclassified"} className={css({ mt: "3" })}>
            <h3 className={css({ textStyle: "body", fontWeight: "bold", mb: "2" })}>
              {group.label}
            </h3>
            {items.length === 0 ? (
              <p>−</p>
            ) : (
              items.map((link, index) => (
                <div
                  key={index}
                  className={
                    link.trial
                      ? css({
                          mb: "3",
                          p: "4",
                          bg: "primary.soft",
                          borderWidth: "1px",
                          borderColor: "primary.600",
                          borderRadius: "card",
                          overflowWrap: "anywhere",
                          textStyle: "supporting",
                        })
                      : css({ mb: "2", overflowWrap: "anywhere", textStyle: "supporting" })
                  }
                >
                  {v.is(MaterialExternalUrlSchema, link.url) ? (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className={
                        link.trial
                          ? css({ color: "text.brandOnSoft", textDecoration: "underline" })
                          : css({ color: "text.brand", textDecoration: "underline" })
                      }
                    >
                      {link.title || "資料名は未入力です"}
                    </a>
                  ) : (
                    <span>{link.title || "資料名は未入力です"}（URLを入力してください）</span>
                  )}
                  {link.trial ? (
                    <>
                      {link.trial.crops ? (
                        <p className={css({ mt: "2", fontWeight: "bold" })}>{link.trial.crops}</p>
                      ) : null}
                      <p className={css({ mt: "2", whiteSpace: "pre-wrap" })}>
                        {link.trial.summary || "概要は未入力です"}
                      </p>
                      <p className={css({ mt: "2", color: "text.muted", textStyle: "note" })}>
                        {[
                          link.trial.institution,
                          link.trial.year === null ? "" : `${link.trial.year}年`,
                          link.trial.pageCount === null ? "" : `${link.trial.pageCount}ページ`,
                        ]
                          .filter(Boolean)
                          .join(" ／ ")}
                      </p>
                    </>
                  ) : null}
                </div>
              ))
            )}
          </div>
        );
      })}
    </section>
  );
}
