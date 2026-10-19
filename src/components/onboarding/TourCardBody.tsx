"use client";

import { Button } from "@/components/Button";

import { css } from "../../../styled-system/css";
import { TourEndButton } from "./TourEndButton";
import { TourLabel } from "./TourLabel";
import { sentenceStyle, sentences } from "./tour-motion";

const headStyle = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "2",
  // 見出し行だけ左右の余白を詰め、ラベルと終了ボタンを1行に収める
  mx: "-2",
  "& > :last-child": { ml: "auto" },
});
const titleStyle = css({ textStyle: "body", fontWeight: "bold", wordBreak: "auto-phrase" });
const bodyStyle = css({ textStyle: "supporting", color: "text.muted" });
// 狭い画面で主ボタンが入りきらないときは、次の行へ送る
const rowStyle = css({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: "2",
  mt: "1",
});

export type TourCardBodyProps = {
  /** 3段階のどこにいるか。左上に「チュートリアル中　1 / 3」と出す */
  section?: number;
  title?: string;
  /** 見出しを囲みの名前にするときの id（aria-labelledby で参照する） */
  titleId?: string;
  body: string;
  /** 主ボタン。画面の本物の操作で進む手順では省く */
  primary?: { label: string; onClick: () => void };
  onSkipStep: () => void;
  onEnd: () => void;
};

/** 吹き出しと下の帯に共通する中身。見出し行（段階と終了）、見出し、説明、スキップと主ボタン。 */
export function TourCardBody({
  section,
  title,
  titleId,
  body,
  primary,
  onSkipStep,
  onEnd,
}: TourCardBodyProps) {
  return (
    <>
      <div className={headStyle}>
        {section ? <TourLabel section={section} /> : <span />}
        <TourEndButton onEnd={onEnd} />
      </div>
      {title ? (
        <h3 id={titleId} className={titleStyle}>
          {title}
        </h3>
      ) : null}
      <p className={bodyStyle}>
        {sentences(body).map((line) => (
          <span key={line} className={sentenceStyle}>
            {line}
          </span>
        ))}
      </p>
      <div className={rowStyle}>
        <Button variant="ghost" size="sm" onClick={onSkipStep}>
          この手順をスキップ
        </Button>
        {primary ? (
          <Button size="sm" onClick={primary.onClick}>
            {primary.label}
          </Button>
        ) : null}
      </div>
    </>
  );
}
