"use client";

import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { useEffect, useState } from "react";

import { css } from "../../../../../../styled-system/css";
import { ImagePlaceholderIcon } from "@/components/Icons";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import {
  MEDIA_PLACEMENTS,
  type ReportMediaInput,
  type ReportMediaType,
} from "@/server/usage-reports/model";

import { FieldError, SectionHeading, formStyles } from "./FormUI";

export type ReportMediaDraft = ReportMediaInput & {
  file: File | null;
};

const mediaGrid = css({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "2.5",
});

const mediaItem = css({ minW: "0" });

const preview = css({
  position: "relative",
  w: "100%",
  aspectRatio: "image.landscape",
  borderRadius: "button",
  bg: "green.soft2",
  color: "brand.primary",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
});

const previewMedia = css({
  display: "block",
  w: "100%",
  h: "100%",
  objectFit: "cover",
});

const mediaKind = css({
  position: "absolute",
  top: "2",
  left: "2",
  borderRadius: "pill",
  bg: "ink/70",
  color: "surface.card",
  px: "2",
  py: "0.5",
  fontSize: "2xs",
  fontWeight: "700",
});

const removeButton = css({
  position: "absolute",
  top: "2",
  right: "2",
  w: "24px",
  h: "24px",
  display: "grid",
  placeItems: "center",
  borderWidth: "0",
  borderRadius: "pill",
  bg: "surface.card",
  color: "text.muted",
  boxShadow: "shadow",
  cursor: "pointer",
});

const mediaSelect = css({ mt: "1.5", px: "2", py: "1.5", fontSize: "xs" });
const caption = css({ mt: "1.5", px: "2", py: "1.5", fontSize: "xs" });

const addLabel = css({
  aspectRatio: "image.landscape",
  borderWidth: "1.5px",
  borderStyle: "dashed",
  borderColor: "border.strong",
  borderRadius: "button",
  display: "grid",
  placeItems: "center",
  color: "text.subtle",
  fontSize: "sm",
  textAlign: "center",
  cursor: "pointer",
});

const hiddenInput = css({
  position: "absolute",
  w: "1px",
  h: "1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
});

function mediaType(file: File): ReportMediaType | null {
  if (file.type.startsWith("image/")) return "photo";
  if (file.type === "video/mp4" || file.type === "video/quicktime") return "video";
  return null;
}

async function videoDuration(file: File): Promise<number> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<number>((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => resolve(video.duration);
      video.onerror = () => reject(new Error("動画の長さを確認できませんでした。"));
      video.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function LocalMediaPreview({
  file,
  mediaType,
  caption,
}: {
  file: File;
  mediaType: ReportMediaType;
  caption: string;
}) {
  const [previewUrl] = useState(() => URL.createObjectURL(file));
  useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  if (mediaType === "video") {
    return <video className={previewMedia} src={previewUrl} controls muted playsInline />;
  }
  return (
    <Image alt={caption} className={previewMedia} fill sizes="50vw" src={previewUrl} unoptimized />
  );
}

function MediaPreview({ item }: { item: ReportMediaDraft }) {
  if (item.file !== null) {
    return <LocalMediaPreview file={item.file} mediaType={item.mediaType} caption={item.caption} />;
  }
  if (item.url.length === 0) return <ImagePlaceholderIcon size={30} />;
  if (item.mediaType === "video") {
    return <video className={previewMedia} src={item.url} controls muted playsInline />;
  }
  return <Image alt={item.caption} className={previewMedia} fill sizes="50vw" src={item.url} />;
}

export function MediaFields({
  media,
  onChange,
  error,
}: {
  media: ReportMediaDraft[];
  onChange: (media: ReportMediaDraft[]) => void;
  error?: string;
}) {
  const [localError, setLocalError] = useState<string>();

  async function addFiles(files: FileList | null): Promise<void> {
    if (files === null) return;
    const next = [...media];
    let videoCount = next.filter(({ mediaType }) => mediaType === "video").length;

    for (const file of files) {
      const type = mediaType(file);
      if (type === null) {
        setLocalError("JPEG、PNG、WebP、MP4、QuickTime形式を選択してください。");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setLocalError("1ファイルのサイズは50MB以下にしてください。");
        return;
      }
      if (type === "video") {
        if (videoCount >= 1) {
          setLocalError("動画は1本まで追加できます。");
          return;
        }
        try {
          if ((await videoDuration(file)) > 180) {
            setLocalError("動画は3分以内にしてください。");
            return;
          }
        } catch (caught) {
          setLocalError(
            caught instanceof Error ? caught.message : "動画の長さを確認できませんでした。",
          );
          return;
        }
        videoCount += 1;
      }

      next.push({
        key: crypto.randomUUID(),
        url: "",
        file,
        mediaType: type,
        placement: type === "video" ? "method" : "observation",
        caption: "",
      });
    }

    setLocalError(undefined);
    onChange(next);
  }

  function updateItem(key: string, values: Partial<ReportMediaDraft>): void {
    onChange(media.map((item) => (item.key === key ? { ...item, ...values } : item)));
  }

  return (
    <>
      <SectionHeading number="3" title="写真・動画" sub="できるだけ追加" />
      <div className={formStyles.field}>
        <p className={formStyles.guide}>
          使用区と対照区の比較や、散布時の様子が特に参考になります。写真・動画ごとに、完成した記事での表示先を選択できます。動画は1本、3分まで追加できます。
        </p>
        <div className={mediaGrid}>
          {media.map((item) => (
            <div key={item.key} className={mediaItem}>
              <div className={preview}>
                <MediaPreview item={item} />
                <span className={mediaKind}>{item.mediaType === "video" ? "動画" : "写真"}</span>
                <button
                  type="button"
                  className={removeButton}
                  aria-label="写真・動画を削除"
                  onClick={() => onChange(media.filter((candidate) => candidate.key !== item.key))}
                >
                  ×
                </button>
              </div>
              <Select
                className={mediaSelect}
                value={item.placement}
                aria-label="記事での表示先"
                onChange={(event) =>
                  updateItem(item.key, {
                    placement: event.target.value as ReportMediaDraft["placement"],
                  })
                }
              >
                {MEDIA_PLACEMENTS.map((placement) => (
                  <option key={placement.value} value={placement.value}>
                    表示先：{placement.label}
                  </option>
                ))}
              </Select>
              <Input
                className={caption}
                value={item.caption}
                placeholder="説明を入力"
                aria-label="写真・動画の説明"
                onChange={(event) => updateItem(item.key, { caption: event.target.value })}
              />
            </div>
          ))}
          <label className={addLabel}>
            ＋
            <br />
            写真・動画を追加
            <input
              className={hiddenInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
              multiple
              onChange={(event) => {
                void addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        </div>
        <FieldError message={localError ?? error} />
      </div>
    </>
  );
}
