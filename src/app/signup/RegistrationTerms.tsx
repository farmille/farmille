import { legalDocuments } from "@/content/legal/documents";
import { renderMarkdownToHtml } from "@/lib/markdown/render";
import { css } from "../../../styled-system/css";
import { legalProse, legalHeading } from "@/app/legal/styles";

export function RegistrationTerms() {
  const documents = legalDocuments
    .filter(({ slug }) => slug === "terms" || slug === "privacy")
    .map((document) => ({
      title: document.title,
      sections: document.sections.map((section) => ({
        heading: section.heading,
        html: renderMarkdownToHtml(section.markdown),
      })),
    }));
  return (
    <div
      role="region"
      aria-label="利用規約・プライバシーポリシー"
      tabIndex={0}
      className={css({
        maxH: "80",
        overflowY: "auto",
        borderWidth: "1px",
        borderColor: "border.default",
        borderRadius: "card",
        p: "4",
        mb: "4",
      })}
    >
      {documents.map((document) => (
        <article key={document.title}>
          <h2 className={legalHeading({ level: "h2" })}>{document.title}</h2>
          {document.sections.map((section, index) => (
            <section key={index}>
              {section.heading ? (
                <h3 className={css({ fontWeight: "bold", textStyle: "title", mt: "4", mb: "2" })}>
                  {section.heading}
                </h3>
              ) : null}
              <div className={legalProse} dangerouslySetInnerHTML={{ __html: section.html }} />
            </section>
          ))}
        </article>
      ))}
    </div>
  );
}
