import { legalDocuments } from "@/content/legal/documents";
import { renderMarkdownToHtml } from "@/lib/markdown/render";
import { css } from "../../../styled-system/css";
import { legalProse, legalHeading } from "@/app/legal/styles";

export async function RegistrationTerms() {
  const documents = await Promise.all(
    legalDocuments
      .filter(({ slug }) => slug === "terms" || slug === "privacy")
      .map(async (document) => ({
        title: document.title,
        sections: await Promise.all(
          document.sections.map(async (section) => ({
            heading: section.heading,
            html: await renderMarkdownToHtml(section.markdown),
          })),
        ),
      })),
  );
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
