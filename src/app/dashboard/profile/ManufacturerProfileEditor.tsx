"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as v from "valibot";
import { FormNotice } from "@/app/_site/FormParts";
import { SellerHeader } from "@/app/sellers/[id]/_components/SellerHeader";
import { Field } from "@/components/auth/Fields";
import { buttonRecipe, Input, surfaceCardRecipe, Textarea } from "@/components";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import {
  ManufacturerProfileSchema,
  type ManufacturerProfileContent,
} from "@/lib/manufacturer-profile";
import { css } from "../../../../styled-system/css";
import { pillButtonRecipe, visuallyHidden } from "../_components/dashboard-styles";
import { saveManufacturerProfile, withdrawManufacturerProfile, uploadLogo } from "./actions";

const draftNote = css(surfaceCardRecipe.raw({ tone: "soft" }), {
  mb: "3",
  borderStyle: "dashed",
  borderColor: "primary.700",
});

const draftNoteTitle = css({ fontSize: "sm" });

const draftNoteText = css({ fontSize: "sm", color: "text.subtle" });

const slots = css({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "2.5",
  mb: "2.5",
  tab: { gridTemplateColumns: "1fr 1fr" },
});

const slot = css({
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  p: "3.5",
});

const dropZone = css({
  display: "block",
  position: "relative",
  borderWidth: "1.5px",
  borderStyle: "dashed",
  borderColor: "border.strong",
  borderRadius: "input",
  p: "5.5",
  textAlign: "center",
  color: "text.subtle",
  fontSize: "sm",
  cursor: "pointer",
  lineHeight: "prose",
  _hover: { borderColor: "primary.700", color: "primary.800" },
  "&:has(input:focus-visible)": {
    borderColor: "primary.700",
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.700",
    outlineOffset: "2px",
  },
});

const fileInput = css({
  position: "absolute",
  inset: "0",
  opacity: "0",
  w: "full",
  h: "full",
  cursor: "pointer",
});

const slotRequirement = css({ fontSize: "xs", color: "text.muted", mt: "2" });

const currentLogo = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  flexWrap: "wrap",
  fontSize: "xs",
  mt: "0.5",
  color: "text.subtle",
});

const logoThumb = css({
  w: "7",
  h: "7",
  borderRadius: "pill",
  objectFit: "cover",
  bg: "surface.page",
  mr: "1.5",
});

const fields = css({ pt: "3.5", px: "4" });

const saveRow = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  flexWrap: "wrap",
  py: "3",
  px: "4",
});

const primaryAction = css(buttonRecipe.raw({ variant: "primary", size: "sm" }), {
  minW: "auto",
  py: "2",
  px: "4",
});

const secondaryAction = css(buttonRecipe.raw({ variant: "ghost", size: "sm" }), {
  minW: "auto",
  py: "2",
  px: "4",
});

export function ManufacturerProfileEditor({
  sellerId,
  name,
  regionScope,
  initialContent,
  expectedVersion,
  pendingVersion,
}: {
  sellerId: string;
  name: string;
  regionScope: string | null;
  initialContent: ManufacturerProfileContent;
  expectedVersion: string | null;
  pendingVersion: string | null;
}) {
  const [content, setContent] = useState(initialContent);
  const [versionId, setVersionId] = useState(expectedVersion);
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function save(submit: boolean) {
    startTransition(async () => {
      const result = await saveManufacturerProfile({ content, expectedVersion: versionId, submit });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setVersionId(submit ? null : result.versionId);
      setMessage(
        submit
          ? "表現確認へ送りました。公開中のプロフィールはまだ変わりません。"
          : "下書きを保存しました。",
      );
      router.refresh();
    });
  }
  const sellerPreview = (
    <div className={css({ mb: "3" })}>
      <SellerHeader
        seller={{
          id: sellerId,
          officialName: name,
          regionScope,
          profileText: content.profileText,
          logoUrl: content.logoUrl || null,
          websiteUrl: content.websiteUrl || null,
        }}
      />
    </div>
  );
  return (
    <div>
      {message ? <FormNotice tone="info">{message}</FormNotice> : null}
      {pendingVersion ? <FormNotice tone="info">プロフィールの表現確認中です。</FormNotice> : null}
      {versionId && !pendingVersion ? (
        <div className={draftNote}>
          <b className={draftNoteTitle}>未公開の下書きを編集中です。</b>
          <span className={draftNoteText}>
            表現確認を経るまで、メーカーページには反映されません。
          </span>
        </div>
      ) : null}
      {preview || pendingVersion ? (
        sellerPreview
      ) : (
        <>
          <div className={slots}>
            <div className={slot}>
              <label className={dropZone} htmlFor="profile-logo">
                ＋<br />
                企業ロゴをアップロード<span className={visuallyHidden}>（ロゴ画像・任意）</span>
                <input
                  className={fileInput}
                  id="profile-logo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-describedby="profile-logo-req"
                  disabled={pending}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    startTransition(async () => {
                      const form = new FormData();
                      form.set("logo", file);
                      const result = await uploadLogo(form);
                      if (!result.ok) {
                        setMessage(result.message);
                        return;
                      }
                      setContent((current) => ({ ...current, logoUrl: result.url }));
                      setMessage(
                        "ロゴをアップロードしました。下書き保存または表現確認への送信をしてください。",
                      );
                    });
                  }}
                />
              </label>
              <div className={slotRequirement} id="profile-logo-req">
                JPEG / PNG / WebP ・ 2MBまで。保存後、表現確認を経て公開されます。
              </div>
              <div className={currentLogo}>
                {content.logoUrl ? (
                  <>
                    <Image
                      alt=""
                      className={logoThumb}
                      src={content.logoUrl}
                      width={28}
                      height={28}
                      sizes="28px"
                    />
                    現在：設定した画像を表示中
                    <button
                      type="button"
                      className={pillButtonRecipe({ tone: "ghost" })}
                      disabled={pending}
                      onClick={() => setContent({ ...content, logoUrl: "" })}
                    >
                      ロゴを外す
                    </button>
                  </>
                ) : (
                  `現在：未設定（頭文字「${name.slice(0, 1)}」を表示中）`
                )}
              </div>
            </div>
          </div>
          <div className={surfaceCardRecipe({ padding: "flush" })}>
            <div className={fields}>
              <Field label="会社紹介" htmlFor="profile-text">
                <Textarea
                  id="profile-text"
                  rows={7}
                  value={content.profileText}
                  onChange={(event) => setContent({ ...content, profileText: event.target.value })}
                  disabled={pending}
                />
              </Field>
              <Field label="公式サイトURL" htmlFor="profile-site">
                <Input
                  id="profile-site"
                  type="url"
                  value={content.websiteUrl}
                  onChange={(event) => setContent({ ...content, websiteUrl: event.target.value })}
                  disabled={pending}
                />
              </Field>
            </div>
          </div>
        </>
      )}
      <div className={css(surfaceCardRecipe.raw({ padding: "flush" }), { mt: "3" })}>
        <div className={saveRow}>
          {pendingVersion ? (
            <button
              type="button"
              className={primaryAction}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  if (await withdrawManufacturerProfile(pendingVersion)) router.refresh();
                  else setMessage("取り下げできませんでした。再読み込みして確認してください。");
                })
              }
            >
              取り下げて編集を再開
            </button>
          ) : (
            <>
              <button
                type="button"
                className={primaryAction}
                disabled={pending}
                onClick={() => save(true)}
              >
                保存して表現確認へ送る
              </button>
              <button
                type="button"
                className={secondaryAction}
                disabled={pending}
                onClick={() => save(false)}
              >
                下書きを保存
              </button>
              <button
                type="button"
                className={secondaryAction}
                disabled={pending}
                onClick={() => {
                  if (!v.is(ManufacturerProfileSchema, content)) {
                    setMessage("URLの入力を確認してください。");
                    return;
                  }
                  setPreview(!preview);
                }}
              >
                {preview ? "編集に戻る" : "プレビュー"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
