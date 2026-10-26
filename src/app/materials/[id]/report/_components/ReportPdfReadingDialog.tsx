"use client";

import { useEffect, useState } from "react";

import { readPdfIntoReportAction } from "@/app/materials/[id]/report/new/actions";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Checkbox, FileInput, Input, Notice } from "@/components/form";
import {
  PDF_READING_CONSENT,
  PDF_READING_RECAPTCHA_ACTION,
  PDF_READING_TRIAL_MAX,
  pdfReadingTrialError,
  type PdfReadingResult,
} from "@/lib/pdf-reading";
import { executeRecaptcha, loadRecaptcha } from "@/lib/recaptcha-client";
import { REPORT_PDF_LIMITS, type UsageReportInput } from "@/lib/usage-report";
import { errorMessageJa } from "@/server/errors";

import { css } from "../../../../../../styled-system/css";

import {
  countPdfPages,
  discardPdfForReading,
  isPdf,
  uploadPdfForReading,
} from "./report-page-images";

type Phase = "idle" | "checking" | "uploading" | "verifying" | "reading";

const STEPS = [
  { phase: "uploading", label: "PDFを送っています" },
  { phase: "verifying", label: "ロボットによる操作でないことを確かめています" },
  { phase: "reading", label: "PDFを読み取っています（十数秒〜1分ほど）" },
] as const satisfies { phase: Phase; label: string }[];

const LIMIT_MESSAGE = `PDFは${REPORT_PDF_LIMITS.bytes / 1024 / 1024}MB以下・${REPORT_PDF_LIMITS.pages}ページ以下のものを選んでください。`;

const body = css({ display: "grid", gap: "4" });

const lead = css({ m: "0", textStyle: "body", color: "text.default" });

const count = css({ m: "0", textStyle: "supporting", fontWeight: "bold", color: "text.brand" });

const steps = css({
  m: "0",
  pl: "5",
  display: "grid",
  gap: "1",
  textStyle: "supporting",
  color: "text.muted",
  "& [aria-current=step]": { color: "text.default", fontWeight: "bold" },
});

const elapsed = css({ m: "0", textStyle: "note", color: "text.muted" });

const TRIAL_GUIDE =
  "PDFの中での資材の呼び名とこの資材の関係（例：高活性腐植資材区がこの資材）、作物と品種（例：キャベツの新藍）、試験の番号（例：試験2）を書きます。";

/** 開くたびに呼び出し側が作り直す（読み取る試験の書き始めは、開いたときの作物と品種から作る）。 */
export function ReportPdfReadingDialog({
  onClose,
  defaultTrial,
  materialId,
  userId,
  siteKey,
  remaining,
  input,
  droppedMediaUrls,
  replaces,
  onRead,
}: {
  onClose: () => void;
  /** 読み取る試験の書き始め。作物と品種が無ければ空。 */
  defaultTrial: string;
  materialId: string;
  userId: string;
  siteKey: string;
  remaining: number;
  /** 今の画面の入力。読み取りの前にサーバーの下書きへ保存してから写す。 */
  input: UsageReportInput;
  /** 画面の入力から外した画像。読み取りの前の保存で、サーバーが置き場から消す。 */
  droppedMediaUrls: () => string[];
  /** 区か数値の調査項目に入力があり、読み取りで置き換わるか。 */
  replaces: boolean;
  onRead: (result: PdfReadingResult) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [trial, setTrial] = useState(defaultTrial);
  const [tried, setTried] = useState(false);
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [problem, setProblem] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const busy = phase !== "idle" && phase !== "checking";

  useEffect(() => {
    // reCAPTCHA の script はこの画面を開いたときだけ読み込む。失敗は送るときに知らせる
    loadRecaptcha(siteKey).catch(() => undefined);
  }, [siteKey]);

  useEffect(() => {
    if (!busy) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [busy]);

  async function choose(next: File | undefined) {
    setFile(null);
    setProblem(null);
    if (next === undefined) return;
    if (!isPdf(next) || next.size > REPORT_PDF_LIMITS.bytes) {
      setProblem(isPdf(next) ? LIMIT_MESSAGE : "PDFファイルを選んでください。");
      return;
    }
    setPhase("checking");
    try {
      const pages = await countPdfPages(next);
      if (pages > REPORT_PDF_LIMITS.pages) setProblem(LIMIT_MESSAGE);
      else setFile(next);
    } catch {
      setProblem(errorMessageJa.pdf_invalid);
    } finally {
      setPhase("idle");
    }
  }

  async function read() {
    setTried(true);
    if (file === null || !consent || busy || pdfReadingTrialError(trial) !== undefined) return;
    setProblem(null);
    setStartedAt(Date.now());
    setNow(Date.now());
    let result: PdfReadingResult;
    // Server Action を呼ぶ前に止めたら、上げた PDF はサーバーが消さないので、ここで消す
    let unsent: string | null = null;
    try {
      setPhase("uploading");
      const uploadPath = await uploadPdfForReading(file, userId);
      unsent = uploadPath;
      setPhase("verifying");
      // トークンの有効期限は2分なので、PDF を上げ終えてから取る
      const recaptchaToken = await executeRecaptcha(siteKey, PDF_READING_RECAPTCHA_ACTION);
      setPhase("reading");
      unsent = null;
      result = await readPdfIntoReportAction(materialId, {
        input,
        droppedMediaUrls: droppedMediaUrls(),
        uploadPath,
        recaptchaToken,
        trial: trial.trim(),
        consent: true,
      });
      // 読み取りの前に断られると、サーバーは PDF を消さない（消してあれば何もしない）
      if (!result.ok) await discardPdfForReading(uploadPath);
    } catch {
      if (unsent !== null) await discardPdfForReading(unsent);
      // 通信の失敗などはブラウザの英語の文言になるので、そのまま出さない
      result = {
        ok: false,
        error: "internal",
        message: errorMessageJa.pdf_reading_failed,
        remaining: null,
        savedDraft: null,
      };
    } finally {
      setPhase("idle");
    }
    if (!result.ok) setProblem(result.message);
    onRead(result);
  }

  const used = remaining <= 0;
  const step = STEPS.findIndex((item) => item.phase === phase);
  return (
    <Dialog
      open
      onOpenChange={(next) => {
        // 読み取りの途中では閉じない（結果を入力に写すまで編集を止める）
        if (!next && !busy) onClose();
      }}
      size="sheet"
      title="PDF読み取り"
      closeLabel="PDF読み取りを閉じる"
      footer={
        <Button
          variant="primary"
          size="sm"
          disabled={file === null || !consent || busy || used}
          onClick={() => void read()}
        >
          {busy ? "読み取っています…" : replaces ? "置き換えて読み取る" : "読み取る"}
        </Button>
      }
    >
      <div className={body}>
        <p className={lead}>
          試験成績書のPDFから、区・数値のグラフ・栽培条件などを読み取って下書きに入れます。入った値は、元のPDFと照らし合わせて確かめてください。
        </p>
        <p className={count}>今月あと{Math.max(remaining, 0)}回</p>
        {used && <Notice tone="warn">{errorMessageJa.pdf_reading_limit}</Notice>}
        <FileInput
          label="PDF"
          requirement="required"
          description={LIMIT_MESSAGE}
          accept="application/pdf,.pdf"
          // ページ数の確認中に選び直すと、先の確認が後から終わって別の PDF が選ばれることがあるので止める
          disabled={busy || phase === "checking"}
          onChange={(event) => void choose(event.currentTarget.files?.[0])}
        />
        <Input
          label="読み取る試験"
          requirement="required"
          description={TRIAL_GUIDE}
          placeholder="例）キャベツの新藍。試験2の高活性腐植資材区がこの資材"
          maxLength={PDF_READING_TRIAL_MAX}
          value={trial}
          error={tried ? pdfReadingTrialError(trial) : undefined}
          disabled={busy}
          onChange={(event) => setTrial(event.target.value)}
        />
        <Checkbox checked={consent} disabled={busy} onCheckedChange={setConsent}>
          {PDF_READING_CONSENT}
        </Checkbox>
        {replaces && (
          <Notice tone="warn">
            いま入力してある区・数値の調査項目・都道府県は、PDFの内容に置き換わります。ほかの欄は、空の欄にだけ入ります。
          </Notice>
        )}
        {phase === "checking" && <p className={elapsed}>PDFを確かめています…</p>}
        {busy && (
          <div role="status">
            <ol className={steps}>
              {STEPS.map((item, index) => (
                <li key={item.phase} aria-current={index === step ? "step" : undefined}>
                  {index < step ? `${item.label}（済）` : item.label}
                </li>
              ))}
            </ol>
            <p className={elapsed}>{Math.max(0, Math.round((now - startedAt) / 1000))}秒経過</p>
          </div>
        )}
        {problem !== null && <Notice tone="error">{problem}</Notice>}
      </div>
    </Dialog>
  );
}
