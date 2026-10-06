import Link from "next/link";
import { notFound } from "next/navigation";
import { legalDocuments } from "@/content/legal/documents";
import { renderMarkdownToHtml } from "@/lib/markdown/render";
import { createPageMetadata } from "@/lib/seo";
import { css } from "../../../../styled-system/css";
import { legalHeading, legalLink, legalProse } from "../styles";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return legalDocuments.map(({ slug }) => ({ slug }));
}

function getDocument(slug: string) {
  const document = legalDocuments.find((entry) => entry.slug === slug);
  if (!document) notFound();
  return document;
}

export async function generateMetadata({ params }: Props) {
  const document = getDocument((await params).slug);
  return createPageMetadata({
    title: document.title,
    description: document.title,
    path: `/legal/${document.slug}`,
  });
}

export default async function LegalDocumentPage({ params }: Props) {
  const document = getDocument((await params).slug);
  const sections = await Promise.all(
    document.sections.map(async (section, index) => ({
      ...section,
      id: `section-${index + 1}`,
      html: await renderMarkdownToHtml(section.markdown),
    })),
  );
  return (
    <>
      <Link href="/legal" className={legalLink}>
        規約・ガイドライン一覧へ
      </Link>
      <article>
        <h1 className={legalHeading({ level: "h1" })}>{document.title}</h1>
        <nav
          aria-label="このページの目次"
          className={css({
            bg: "surface.card",
            borderWidth: "1px",
            borderColor: "border.default",
            borderRadius: "card",
            p: "5",
            mb: "8",
          })}
        >
          <p className={css({ fontWeight: "bold", mb: "3" })}>目次</p>
          <ul
            className={css({
              listStyle: "none",
              p: "0",
              m: "0",
              display: "flex",
              flexDirection: "column",
              gap: "3",
            })}
          >
            {sections
              .filter((section) => section.heading)
              .map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={legalLink}>
                    {section.heading}
                  </a>
                </li>
              ))}
          </ul>
        </nav>
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className={css({ mb: "10", scrollMarginTop: "24" })}
          >
            {section.heading ? (
              <h2 className={legalHeading({ level: "h2" })}>{section.heading}</h2>
            ) : null}
            <div className={legalProse} dangerouslySetInnerHTML={{ __html: section.html }} />
          </section>
        ))}
      </article>
      <Link href="/legal" className={legalLink}>
        規約・ガイドライン一覧へ戻る
      </Link>
    </>
  );
}
