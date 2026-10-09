"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as v from "valibot";
import { SellerHeader } from "@/app/sellers/[id]/_components/SellerHeader";
import { Button, FileInput, Input, Textarea } from "@/components";
import { Field, FormMessage, HintBox, formActionsStyle } from "@/components/auth/Fields";
import { materialPageStack } from "@/components/materials/MaterialPageContent";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import {
  ManufacturerProfileSchema,
  type ManufacturerProfileContent,
} from "@/lib/manufacturer-profile";
import { css } from "../../../../styled-system/css";
import { saveManufacturerProfile, withdrawManufacturerProfile, uploadLogo } from "./actions";

const currentLogoStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  flexWrap: "wrap",
  fontSize: "xs",
  mt: "2",
  color: "text.subtle",
});

const logoThumbStyle = css({
  w: "7",
  h: "7",
  borderRadius: "pill",
  objectFit: "cover",
  bg: "surface.page",
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
  return (
    <div className={materialPageStack}>
      {message ? <FormMessage tone="info">{message}</FormMessage> : null}
      {pendingVersion ? (
        <FormMessage tone="info">プロフィールの表現確認中です。</FormMessage>
      ) : null}
      {versionId && !pendingVersion ? (
        <HintBox>
          未公開の下書きを編集中です。表現確認を経るまで、メーカーページには反映されません。
        </HintBox>
      ) : null}
      {preview || pendingVersion ? (
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
      ) : (
        <>
          <Field
            label="ロゴ画像"
            htmlFor="profile-logo"
            requirement="optional"
            guide="JPEG・PNG・WebP、2MBまで。保存後、表現確認を経て公開されます。"
          >
            <FileInput
              id="profile-logo"
              accept="image/jpeg,image/png,image/webp"
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
              disabled={pending}
            />
            <div className={currentLogoStyle}>
              {content.logoUrl ? (
                <>
                  <Image
                    alt=""
                    className={logoThumbStyle}
                    src={content.logoUrl}
                    width={28}
                    height={28}
                    sizes="28px"
                  />
                  現在：設定した画像を表示中
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => setContent({ ...content, logoUrl: "" })}
                  >
                    ロゴを外す
                  </Button>
                </>
              ) : (
                `現在：未設定（頭文字「${name.slice(0, 1)}」を表示中）`
              )}
            </div>
          </Field>
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
        </>
      )}
      <div className={formActionsStyle}>
        {pendingVersion ? (
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                if (await withdrawManufacturerProfile(pendingVersion)) router.refresh();
                else setMessage("取り下げできませんでした。再読み込みして確認してください。");
              })
            }
          >
            取り下げて編集を再開
          </Button>
        ) : (
          <>
            <Button disabled={pending} onClick={() => save(true)}>
              保存して表現確認へ送る
            </Button>
            <Button disabled={pending} variant="ghost" onClick={() => save(false)}>
              下書きを保存
            </Button>
            <Button
              disabled={pending}
              variant="ghost"
              onClick={() => {
                if (!v.is(ManufacturerProfileSchema, content)) {
                  setMessage("URLの入力を確認してください。");
                  return;
                }
                setPreview(!preview);
              }}
            >
              {preview ? "編集に戻る" : "プレビュー"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
