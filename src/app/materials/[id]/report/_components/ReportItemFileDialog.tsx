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
  fitCanvas,
  isImage,
  isPdf,
  openPdf,
  renderPdfPage,
  uploadReportImage,
} from "./report-page-images";
import type { ReportPageImage, ReportPageItem } from "./report-page-state";

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
  onCommit,
  onDelete,
  onClose,
}: {
  item: ReportPageItem;
  isNew: boolean;
  userId: string;
  reportId: string;
  onCommit: (item: ReportPageItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  // 項目ごとに呼び出し側が作り直す（key）ので、最初の状態はその項目の画像
  const [images, setImages] = useState<DraftImage[]>(() => item.images.map(fromSaved));
  const [open, setOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [asking, setAsking] = useState(false);
  const [editing, setEditing] = useState<DraftImage | null>(null);
  const [pdf, setPdf] = useState<{
    doc: PDFDocumentProxy;
    name: string;
    resolve: (pages: number[]) => void;
  } | null>(null);
  const live = useRef(true);

  const changed =
    images.length !== item.images.length ||
    images.some(
      (image, index) =>
        image.dirty ||
        image.id !== item.images[index]?.id ||
        image.caption !== item.images[index]?.caption,
    );

  function add(canvas: HTMLCanvasElement) {
    if (!live.current) return;
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
    for (const file of files) {
      if (!live.current) return;
      if (isPdf(file)) {
        setMessage(`「${file.name}」を開いています…`);
        try {
          const doc = await openPdf(file);
          if (!live.current) return;
          if (doc.numPages === 1) {
            setMessage("ページを画像にしています…");
            add(await renderPdfPage(doc, 1));
          } else {
            setMessage("");
            const pages = await new Promise<number[]>((resolve) =>
              setPdf({ doc, name: file.name, resolve }),
            );
            for (const [index, page] of pages.entries()) {
              if (!live.current) return;
              setMessage(`ページを画像にしています（${index + 1}/${pages.length}）…`);
              add(await renderPdfPage(doc, page));
            }
          }
          setMessage("");
        } catch {
          setMessage(`「${file.name}」を開けませんでした。`);
        }
        continue;
      }
      if (!isImage(file)) {
        setMessage(
          `「${file.name}」は写真（JPEG・PNG・WebP）でもPDFでもないため、追加できません。`,
        );
        continue;
      }
      setMessage(`「${file.name}」を読み込んでいます…`);
      try {
        add(await canvasFromImageFile(file));
        setMessage("");
      } catch {
        setMessage(
          `「${file.name}」を読み込めませんでした。JPEG・PNG で保存し直すと追加できます。`,
        );
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
    setSaving(true);
    try {
      const saved: ReportPageImage[] = [];
      for (const [index, image] of images.entries()) {
        setMessage(`画像を保存しています（${index + 1}/${images.length}）…`);
        if (!image.dirty || image.canvas === null) {
          if (image.url !== null)
            saved.push({ id: image.id, url: image.url, caption: image.caption });
          continue;
        }
        // 編集した画像は別の画像として保存し直す（保存済みの画像は上書きしない）
        const id = image.url === null ? image.id : crypto.randomUUID();
        saved.push({
          id,
          url: await uploadReportImage(image.canvas, userId, reportId, id),
          caption: image.caption,
        });
      }
      live.current = false;
      onCommit({ ...item, mode: "file", images: saved });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "画像を保存できませんでした。");
    } finally {
      setSaving(false);
    }
  }

  function close() {
    live.current = false;
    pdf?.resolve([]);
    setPdf(null);
    setOpen(false);
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
              <button type="button" className={deleteButton} onClick={() => onDelete(item.id)}>
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
          写真（JPEG・PNG・WebP）とPDFを、何枚でも選べます。PDFは使うページを選べます。
          <br />
          氏名や連絡先が写っていたら、「画像を編集する」の塗りつぶしで隠してください。
        </p>
        {images.map((image, index) => (
          <div key={image.id} className={card}>
            <button
              type="button"
              className={removeButton}
              aria-label={`${index + 1}枚目の画像を削除`}
              onClick={() => setImages((previous) => previous.filter((x) => x.id !== image.id))}
            >
              <Icon name="close" size="sm" />
            </button>
            <img className={shot} src={image.preview} alt={`${index + 1}枚目の画像`} />
            <Input
              label="画像のタイトル"
              requirement="optional"
              placeholder="例）図1 可販果収量"
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
              onClick={() => void startEdit(image)}
            >
              画像を編集する（回転・切り取り・塗りつぶし）
            </Button>
          </div>
        ))}
        <label className={pick}>
          <Icon name="add" size="sm" />
          {images.length > 0 ? "写真・PDFを追加" : "写真・PDFを選ぶ"}（複数可）
          <input
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
