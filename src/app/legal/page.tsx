import Link from "next/link";
import { legalDocuments } from "@/content/legal/documents";
import { createPageMetadata } from "@/lib/seo";
import { css } from "../../../styled-system/css";
import { legalHeading, legalLink } from "./styles";

export function generateMetadata() {
  return createPageMetadata({
    title: "規約・ガイドライン",
    description:
      "Farmilleの利用規約、投稿ガイドライン、個人情報の取り扱い、メーカー会員向けの規約をご確認いただけます。",
    path: "/legal",
  });
}

export default function LegalIndexPage() {
  const groups = [...new Set(legalDocuments.map((document) => document.group))];
  return (
    <>
      <Link href="/" className={legalLink}>
        ホームへ戻る
      </Link>
      <h1 className={legalHeading({ level: "h1" })}>規約・ガイドライン</h1>
      <p className={css({ textStyle: "supporting", color: "text.muted", mb: "8" })}>
        Farmilleをご利用の際は、各規約・ガイドラインをご確認ください。
      </p>
      <div
        className={css({
          display: "grid",
          gap: "8",
          tab: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
        })}
      >
        {groups.map((group) => (
          <section key={group}>
            <h2 className={legalHeading({ level: "h2" })}>{group}</h2>
            <ul className={css({ listStyle: "none", p: "0", m: "0" })}>
              {legalDocuments
                .filter((document) => document.group === group)
                .map((document) => (
                  <li
                    key={document.slug}
                    className={css({ borderBottomWidth: "1px", borderColor: "border.default" })}
                  >
                    <Link
                      href={`/legal/${document.slug}`}
                      className={css({
                        display: "block",
                        py: "4",
                        color: "text.brand",
                        textDecoration: "underline",
                        textStyle: "body",
                      })}
                    >
                      {document.title.replace(/^Farmille /, "")}
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
