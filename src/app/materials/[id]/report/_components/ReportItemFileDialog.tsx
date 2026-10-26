"use client";

import { useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";
import { Input } from "@/components/form";

import { css } from "../../../../../../styled-system/css";

import { ReportImageEditor } from "./ReportImageEditor";
import { ReportPdfPagePicker } from "./ReportPdfPagePicker";
import {
  canvasFromImageFile,
  canvasFromUrl,
  fileTooLarge,
  fitCanvas,
  isImage,
  isPdf,
  megabytes,
  openPdf,
  pdfTooLong,
  removeReportImages,
  renderPdfPage,
  uploadReportImage,
} from "./report-page-images";
import {
  REPORT_IMAGE_LIMIT,
  REPORT_PDF_LIMITS,
  REPORT_PHOTO_LIMITS,
  REPORT_SHORT_MAX,
  type ReportPageImage,
  reportPageItemImages,
  type ReportPageItem,
} from "./report-page-state";

/** 差し込み中の画像。dirty は、まだ保存していない（新しい・編集した）画像。 */
type DraftImage = {
  id: string;
  caption: string;
  preview: string;
  url: string | null;
  dirty: boolean;
  canvas: HTMLCanvasElement | null;
  original: HTMLCanvasElement | null;
};

const lead = css({ m: "0", textStyle: "supporting", color: "text.default" });

const heading = css({ fontWeight: "bold", textStyle: "body" });

const required = css({ ml: "1.5", fontSize: "sm", fontWeight: "normal", color: "accent.danger" });

const card = css({
  position: "relative",
  mt: "3",
  p: "2.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
});

const shot = css({
  display: "block",
  w: "full",
  maxH: "64",
  objectFit: "contain",
  bg: "surface.panel",
  borderRadius: "input",
});

const removeButton = css({
  position: "absolute",
  top: "3.5",
  right: "3.5",
  display: "grid",
  placeItems: "center",
  w: "8",
  h: "8",
  border: "none",
  borderRadius: "pill",
  bg: "scrim/60",
  color: "text.inverse",
  cursor: "pointer",
  _hover: { bg: "scrim/80" },
  _disabled: { opacity: "disabled", cursor: "not-allowed" },
});

const editButton = css({ mt: "2.5" });

const pick = css({
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  mt: "3",
  fontWeight: "bold",
  color: "text.brand",
  cursor: "pointer",
  "&:focus-within": { outlineWidth: "2px", outlineStyle: "solid", outlineColor: "primary.700" },
  "& input": { position: "absolute", w: "[1px]", h: "[1px]", opacity: "0", overflow: "hidden" },
  "&[data-disabled]": { color: "text.muted", cursor: "not-allowed" },
});

const rejectList = css({
  m: "0",
  mt: "2",
  pl: "5",
  listStyleType: "disc",
  textStyle: "supporting",
  color: "accent.danger",
});

const status = css({ mt: "2", textStyle: "supporting", color: "text.muted" });

const deleteButton = css({
  border: "none",
  bg: "transparent",
  p: "0",
  mr: "auto",
  fontWeight: "bold",
  color: "accent.danger",
  cursor: "pointer",
  _disabled: { opacity: "disabled", cursor: "not-allowed" },
});

function previewOf(canvas: HTMLCanvasElement) {
  return fitCanvas(canvas, canvas.width, canvas.height, 1400).toDataURL("image/jpeg", 0.85);
}

function fromSaved(image: ReportPageImage): DraftImage {
  return { ...image, preview: image.url, dirty: false, canvas: null, original: null };
}

/**
 * 調査項目に資料のグラフ・表（写真・PDF）を差し込むポップアップ。
 * 背景や × で閉じるときは、何か変えていれば確かめる。新しい項目は書いた分をページに残し、変更中の項目は変更前に戻す。
 */
export function ReportItemFileDialog({
  item,
  isNew,
  userId,
  reportId,
  imageLimit,
  onCommit,
  onDelete,
  onClose,
}: {
  item: ReportPageItem;
  isNew: boolean;
  userId: string;
  reportId: string;
  /** この調査項目に入れられる画像の数（レポート全体の上限から、ほかの項目の画像を引いた数）。 */
  imageLimit: number;
  onCommit: (item: ReportPageItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  // 項目ごとに呼び出し側が作り直す（key）ので、最初の状態はその項目の画像
  const saved = reportPageItemImages(item);
  const [images, setImages] = useState<DraftImage[]>(() => saved.map(fromSaved));
  const [open, setOpen] = useState(true);
  // 進み具合（読み込み中など）と、追加できなかった理由は分けて持つ。理由は次のファイルの読み込みで消さない
  const [message, setMessage] = useState("");
  const [rejected, setRejected] = useState<string[]>([]);
  // 保存中に消す・題を変える・編集すると、保存を始めたときの画像で閉じて黙って失われるので、保存中は操作を止める
  const [saving, setSaving] = useState(false);
  const [asking, setAsking] = useState(false);
  const [editing, setEditing] = useState<DraftImage | null>(null);
  const [pdf, setPdf] = useState<{
    doc: PDFDocumentProxy;
    name: string;
    resolve: (pages: number[]) => void;
    max: number;
  } | null>(null);
  const live = useRef(true);
  const committing = useRef(false);
  // このポップアップで上げた画像。ページに入れずに捨てたら、公開の置き場からその場で消す
  const uploaded = useRef<{ url: string; path: string }[]>([]);
  // 読み込み中に次のファイルを選ぶと、枚数の上限の判定を同時に通り抜けるので、終わるまで選択欄を止める
  const [reading, setReading] = useState(false);
  const readingNow = useRef(false);
  // 読み込み中に増えた枚数も数えるため、追加を始めた時の枚数から ref で数える
  const count = useRef(0);
  const full = images.length >= imageLimit;

  const changed =
    images.length !== saved.length ||
    images.some(
      (image, index) =>
        image.dirty || image.id !== saved[index]?.id || image.caption !== saved[index]?.caption,
    );

  function add(canvas: HTMLCanvasElement) {
    if (!live.current) return;
    count.current += 1;
    setImages((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        caption: "",
        preview: previewOf(canvas),
        url: null,
        dirty: true,
        canvas,
        original: canvas,
      },
    ]);
  }

  async function addFiles(files: File[]) {
    if (readingNow.current) return;
    readingNow.current = true;
    setReading(true);
    try {
      await readFiles(files);
    } finally {
      readingNow.current = false;
      setReading(false);
    }
  }

  async function readFiles(files: File[]) {
    count.current = images.length;
    setRejected([]);
    const reject = (text: string) => setRejected((previous) => [...previous, text]);
    for (const file of files) {
      if (!live.current) return;
      if (count.current >= imageLimit) {
        reject(
          `画像はレポート全体で${REPORT_IMAGE_LIMIT}枚までのため、「${file.name}」は追加できませんでした。`,
        );
        continue;
      }
      if (isPdf(file)) {
        const tooLarge = fileTooLarge(file);
        if (tooLarge !== null) {
          reject(tooLarge);
          continue;
        }
        setMessage(`「${file.name}」を開いています…`);
        try {
          const doc = await openPdf(file);
          // 上限超え・途中で閉じた・描画の失敗のどれで抜けても、pdf.js の文書と worker を残さない
          try {
            if (!live.current) return;
            const tooLong = pdfTooLong(file.name, doc.numPages);
            if (tooLong !== null) {
              setMessage("");
              reject(tooLong);
              continue;
            }
            if (doc.numPages === 1) {
              setMessage("ページを画像にしています…");
              add(await renderPdfPage(doc, 1));
            } else {
              setMessage("");
              const pages = await new Promise<number[]>((resolve) =>
                setPdf({ doc, name: file.name, resolve, max: imageLimit - count.current }),
              );
              for (const [index, page] of pages.entries()) {
                if (!live.current) return;
                setMessage(`ページを画像にしています（${index + 1}/${pages.length}）…`);
                add(await renderPdfPage(doc, page));
              }
            }
          } finally {
            void doc.destroy();
          }
          setMessage("");
        } catch {
          setMessage("");
          reject(`「${file.name}」を開けませんでした。`);
        }
        continue;
      }
      if (!isImage(file)) {
        reject(`「${file.name}」は写真（JPEG・PNG・WebP）でもPDFでもないため、追加できません。`);
        continue;
      }
      const tooLarge = fileTooLarge(file);
      if (tooLarge !== null) {
        reject(tooLarge);
        continue;
      }
      setMessage(`「${file.name}」を読み込んでいます…`);
      try {
        add(await canvasFromImageFile(file));
        setMessage("");
      } catch {
        setMessage("");
        reject(`「${file.name}」を読み込めませんでした。JPEG・PNG で保存し直すと追加できます。`);
      }
    }
  }

  async function startEdit(image: DraftImage) {
    if (image.canvas !== null) {
      setEditing(image);
      return;
    }
    if (image.url === null) return;
    setMessage("画像を読み込んでいます…");
    try {
      const canvas = await canvasFromUrl(image.url);
      const loaded = { ...image, canvas, original: canvas };
      setImages((previous) => previous.map((x) => (x.id === image.id ? loaded : x)));
      setEditing(loaded);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "画像を読み込めませんでした。");
    }
  }

  async function commit() {
    // 連打で二重に保存しない（state の disabled は次の描画まで効かない）
    if (committing.current) return;
    committing.current = true;
    setSaving(true);
    let current = images;
    try {
      for (const [index, image] of current.entries()) {
        if (!image.dirty || image.canvas === null) continue;
        setMessage(`画像を保存しています（${index + 1}/${current.length}）…`);
        // 保存はいつも新しい名前で行う（途中で失敗した画像を送り直しても、同じ名前とぶつからない）
        const id = crypto.randomUUID();
        const { url, path } = await uploadReportImage(image.canvas, userId, reportId, id);
        uploaded.current.push({ url, path });
        // 保存できた画像はすぐ控える。あとの画像で失敗しても、押し直したときに送り直さない
        current = current.map((x) =>
          x.id === image.id ? { ...x, id, url, dirty: false, preview: x.preview } : x,
        );
        setImages(current);
      }
      setMessage("");
      live.current = false;
      const committed = current.flatMap((image) =>
        image.url === null ? [] : [{ id: image.id, url: image.url, caption: image.caption }],
      );
      // 前の保存で上げたあと、ページに入れる前に消した画像
      void discardUploads(new Set(committed.map((image) => image.url)));
      onCommit({ ...item, mode: "file", images: committed });
    } catch (error) {
      setMessage(
        `${error instanceof Error ? error.message : "画像を保存できませんでした。"}保存できた画像はそのまま残っています。`,
      );
    } finally {
      committing.current = false;
      setSaving(false);
    }
  }

  function discardUploads(kept: ReadonlySet<string> = new Set()) {
    const paths = uploaded.current.filter(({ url }) => !kept.has(url)).map(({ path }) => path);
    uploaded.current = [];
    return removeReportImages(paths);
  }

  function close() {
    live.current = false;
    pdf?.resolve([]);
    setPdf(null);
    setOpen(false);
    void discardUploads();
    onClose();
  }

  const title = `${item.name.trim() || "調査項目"}：資料のグラフ・表を差し込む`;
  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (open || saving) return;
          if (changed) setAsking(true);
          else close();
        }}
        size="sheet"
        title={title}
        footer={
          <>
            {!isNew && (
              <button
                type="button"
                className={deleteButton}
                disabled={saving}
                onClick={() => {
                  void discardUploads();
                  onDelete(item.id);
                }}
              >
                この調査項目を削除
              </button>
            )}
            <Button
              variant="primary"
              size="sm"
              disabled={saving || images.length === 0}
              onClick={() => void commit()}
            >
              {saving ? "保存しています…" : isNew ? "ページに入れる" : "変更を反映する"}
            </Button>
          </>
        }
      >
        <div className={heading}>
          グラフ・表の画像・PDF<span className={required}>必須</span>
        </div>
        <p className={lead}>
          写真（JPEG・PNG・WebP、{megabytes(REPORT_PHOTO_LIMITS.bytes)}まで）とPDF（
          {megabytes(REPORT_PDF_LIMITS.bytes)}・{REPORT_PDF_LIMITS.pages}
          ページまで）を選べます。PDFは使うページを選べます。
          <br />
          画像はレポート全体で{REPORT_IMAGE_LIMIT}枚まで（この調査項目にはあと
          {Math.max(0, imageLimit - images.length)}枚）。
          <br />
          氏名や連絡先が写っていたら、「画像を編集する」の塗りつぶしで隠してください。
        </p>
        {images.map((image, index) => (
          <div key={image.id} className={card}>
            <button
              type="button"
              className={removeButton}
              aria-label={`${index + 1}枚目の画像を削除`}
              disabled={saving}
              onClick={() => setImages((previous) => previous.filter((x) => x.id !== image.id))}
            >
              <Icon name="close" size="sm" />
            </button>
            <img className={shot} src={image.preview} alt={`${index + 1}枚目の画像`} />
            <Input
              label="画像のタイトル"
              requirement="optional"
              placeholder="例）図1 可販果収量"
              maxLength={REPORT_SHORT_MAX}
              disabled={saving}
              value={image.caption}
              onChange={(event) =>
                setImages((previous) =>
                  previous.map((x) =>
                    x.id === image.id ? { ...x, caption: event.target.value } : x,
                  ),
                )
              }
            />
            <Button
              variant="primary"
              size="md"
              className={editButton}
              disabled={saving}
              onClick={() => void startEdit(image)}
            >
              画像を編集する（回転・切り取り・塗りつぶし）
            </Button>
          </div>
        ))}
        <label className={pick} data-disabled={full || reading || saving ? "" : undefined}>
          <Icon name="add" size="sm" />
          {full
            ? `画像は${REPORT_IMAGE_LIMIT}枚まで入っています`
            : reading
              ? "読み込みが終わると、次の写真・PDFを選べます"
              : `${images.length > 0 ? "写真・PDFを追加" : "写真・PDFを選ぶ"}（複数可）`}
          <input
            disabled={full || reading || saving}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            multiple
            onChange={(event) => {
              const files = [...(event.target.files ?? [])];
              event.target.value = "";
              void addFiles(files);
            }}
          />
        </label>
        {message && (
          <p className={status} role="status">
            {message}
          </p>
        )}
        {rejected.length > 0 && (
          <ul className={rejectList} role="alert">
            {rejected.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        )}
        <p className={status}>
          グラフ・表だけでは伝わらないことは、ページに戻ってから補足説明に書けます。
        </p>
      </Dialog>
      <ConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        title="記入をやめますか？"
        description={
          !isNew
            ? "ここで変えた内容は反映されず、変更前のままになります。"
            : images.length > 0
              ? "ここまでの内容はページに残ります。あとで続きを書けます。"
              : "入力した内容は残りません。"
        }
        confirmLabel="記入をやめる"
        cancelLabel="記入を続ける"
        tone="primary"
        onConfirm={async () => {
          setAsking(false);
          if (isNew && images.length > 0) await commit();
          else close();
        }}
      />
      <ReportPdfPagePicker
        key={`pdf:${pdf?.name ?? ""}`}
        doc={pdf?.doc ?? null}
        name={pdf?.name ?? ""}
        max={pdf?.max ?? 0}
        onCancel={() => {
          pdf?.resolve([]);
          setPdf(null);
        }}
        onPick={(pages) => {
          pdf?.resolve(pages);
          setPdf(null);
        }}
      />
      <ReportImageEditor
        key={editing === null ? "editor" : `editor:${editing.id}:${editing.preview.length}`}
        open={editing !== null}
        original={editing?.original ?? null}
        current={editing?.canvas ?? null}
        onCancel={() => setEditing(null)}
        onDone={(canvas) => {
          const target = editing;
          setEditing(null);
          if (target === null || canvas === target.canvas) return;
          setImages((previous) =>
            previous.map((x) =>
              x.id === target.id ? { ...x, canvas, dirty: true, preview: previewOf(canvas) } : x,
            ),
          );
        }}
      />
    </>
  );
}
