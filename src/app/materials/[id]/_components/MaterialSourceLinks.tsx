import * as v from "valibot";

import {
  MATERIAL_LINK_GROUPS,
  MaterialExternalUrlSchema,
  type MaterialPageContent,
} from "@/lib/material-page-editor";

import { MockExternalIcon } from "./MockParts";

type MaterialLink = MaterialPageContent["links"][number];
type LinkGroup = MaterialLink["group"];

const groupTitleStyle = { fontSize: 11, fontWeight: 700, padding: "8px 2px 2px" } as const;
const emptyStyle = { fontSize: 12, padding: "4px 2px 8px" } as const;

function linkKind(url: string): "PDF" | "LINK" {
  return /\.pdf(?:$|[?#])/i.test(url) ? "PDF" : "LINK";
}

/** 見本の srcGroup の1行（`.file-row`）。 */
function FileRow({ link }: { link: MaterialLink }) {
  const title = link.title || "資料名は未入力です";
  const valid = v.is(MaterialExternalUrlSchema, link.url);
  return (
    <div className="file-row">
      <span className="file-ic">{linkKind(link.url)}</span>
      <div style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
        <div className="fr-title">{valid ? title : `${title}（URLを入力してください）`}</div>
      </div>
      {valid ? (
        <a className="file-dl" href={link.url} target="_blank" rel="noreferrer">
          <MockExternalIcon />
          開く
        </a>
      ) : null}
    </div>
  );
}

/** 見本の testCard（`.test-row`）。試験の概要は運営・メーカーが入力した公開情報。 */
function TestRow({ link }: { link: MaterialLink }) {
  const title = link.title || "資料名は未入力です";
  const trial = link.trial;
  const meta = [
    trial?.institution,
    trial?.year === null || trial?.year === undefined ? "" : `${trial.year}年`,
    trial?.pageCount === null || trial?.pageCount === undefined ? "" : `${trial.pageCount}ページ`,
  ].filter(Boolean);
  const body = (
    <>
      <span className="file-ic">{linkKind(link.url)}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="tr-title">
          {title}
          {trial?.crops ? `｜${trial.crops}` : ""}
        </div>
        <div className="tr-sum">{trial?.summary || "概要は未入力です"}</div>
        {meta.length > 0 ? (
          <div className="tr-meta">
            {meta.map((item, index) => (
              <span key={index}>
                {index > 0 ? <span className="dot">・</span> : null}
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
      <div className="test-row">
        {body}
        <span className="tr-open">URL未入力</span>
      </div>
    );
  }
  return (
    <a className="test-row" href={link.url} target="_blank" rel="noreferrer">
      {body}
      <span className="tr-open">
        <MockExternalIcon /> 開く
      </span>
    </a>
  );
}

function isTrialGroup(group: LinkGroup): boolean {
  return group === "public_trial" || group === "other_trial";
}

/** 見本 S.material の box5（リンク・資料）。分類ごとに並べ、無い分類は「−」。 */
export function MaterialSourceLinks({ links }: { links: MaterialPageContent["links"] }) {
  const groups: ReadonlyArray<{ value: LinkGroup; label: string }> = [
    ...MATERIAL_LINK_GROUPS,
    ...(links.some((link) => link.group === null) ? [{ value: null, label: "分類未選択" }] : []),
  ];
  return (
    <section aria-labelledby="material-links-heading">
      <h2 id="material-links-heading" className="pp-h">
        リンク・資料
      </h2>
      <div className="card" style={{ marginTop: 10, padding: "6px 14px 10px" }}>
        {groups.map((group) => {
          const items = links.filter((link) => link.group === group.value);
          const trial = isTrialGroup(group.value);
          return (
            <div key={group.value ?? "unclassified"}>
              <h3 className="muted" style={groupTitleStyle}>
                {group.label}
              </h3>
              {items.length === 0 ? (
                <div className="muted" style={emptyStyle}>
                  −
                </div>
              ) : trial ? (
                <div className="test-list">
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
    </section>
  );
}
