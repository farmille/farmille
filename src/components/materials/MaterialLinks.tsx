import * as v from "valibot";
import {
  MATERIAL_LINK_GROUPS,
  MaterialExternalUrlSchema,
  type MaterialPageContent,
} from "@/lib/material-page-editor";
import { uniqueMaterialLinks } from "@/lib/material-links";
import { css } from "../../../styled-system/css";

export function MaterialLinks({ links }: { links: MaterialPageContent["links"] }) {
  const unique = uniqueMaterialLinks(links);
  return (
    <section aria-label="リンク・資料">
      <h2 className={css({ fontSize: "lg", fontWeight: "700", mb: "3" })}>リンク・資料</h2>
      {MATERIAL_LINK_GROUPS.map((group) => {
        const items = unique.filter((link) => link.group === group.value);
        return (
          <div key={group.value} className={css({ mt: "3" })}>
            <h3 className={css({ fontSize: "sm", fontWeight: "700", mb: "2" })}>{group.label}</h3>
            {items.length === 0 ? (
              <p>−</p>
            ) : (
              items.map((link, index) => (
                <p
                  key={index}
                  className={css({ mb: "2", overflowWrap: "anywhere", fontSize: "sm" })}
                >
                  {v.is(MaterialExternalUrlSchema, link.url) ? (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className={css({ color: "brand.primaryDeep", textDecoration: "underline" })}
                    >
                      {link.title || "資料名は未入力です"}
                    </a>
                  ) : (
                    <span>{link.title || "資料名は未入力です"}（URLを入力してください）</span>
                  )}
                </p>
              ))
            )}
          </div>
        );
      })}
    </section>
  );
}
