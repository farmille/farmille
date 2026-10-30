"use client";
import { useReducer, useTransition } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { usePersistedInput } from "@/lib/hooks/use-form-persisted-input";
import { useRouter } from "next/navigation";
import * as v from "valibot";
import { SellerHeader } from "@/app/sellers/[id]/_components/SellerHeader";
import { Button } from "@/components";
import { Field, FileInput, FormActions, Input, Notice, Textarea } from "@/components/form";
import { materialPageStack } from "@/components/materials/MaterialPageContent";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import {
  ManufacturerProfileSchema,
  type ManufacturerProfileContent,
} from "@/lib/manufacturer-profile";
import { css } from "../../../../styled-system/css";
import { saveManufacturerProfile, withdrawManufacturerProfile, uploadLogo } from "./actions";

// 書きかけの URL も戻せるよう、保存時の URL 検査はかけず形だけを確かめる
const ProfileInputSchema = v.object({
  profileText: v.string(),
  logoUrl: v.string(),
  websiteUrl: v.string(),
});
const currentLogoStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  flexWrap: "wrap",
  textStyle: "note",
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
  const form = useForm({ defaultValues: { content: initialContent } });
  const content = useStore(form.store, (state) => state.values.content);
  const [savedContent, setSavedContent] = useReducer(
    (_: string, next: string) => next,
    initialContent,
    JSON.stringify,
  );
  const [versionId, setVersionId] = useReducer(
    (_: string | null, next: string | null) => next,
    expectedVersion,
  );
  const [preview, setPreview] = useReducer((_: boolean, next: boolean) => next, false);
  const [message, setMessage] = useReducer(
    (
      _: { tone: "success" | "error"; text: string } | null,
      next: { tone: "success" | "error"; text: string } | null,
    ) => next,
    null,
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  usePersistedInput({
    name: "manufacturer-profile",
    schema: ProfileInputSchema,
    unsaved: pendingVersion || JSON.stringify(content) === savedContent ? null : content,
    // 表現確認中は編集できないので、保存前の入力を戻さない
    restore: (restored) => {
      if (!pendingVersion) form.setFieldValue("content", restored);
    },
  });
  function save(submit: boolean) {
    startTransition(async () => {
      const result = await saveManufacturerProfile({ content, expectedVersion: versionId, submit });
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      setVersionId(submit ? null : result.versionId);
      setSavedContent(JSON.stringify(content));
      setMessage({
        tone: "success",
        text: submit
          ? "表現確認へ送りました。公開中のプロフィールはまだ変わりません。"
          : "下書きを保存しました。",
      });
      router.refresh();
    });
  }
  return (
    <div className={materialPageStack}>
      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      {pendingVersion ? <Notice tone="info">プロフィールの表現確認中です。</Notice> : null}
      {versionId && !pendingVersion ? (
        <Notice tone="neutral">
          未公開の下書きを編集中です。表現確認を経るまで、メーカーページには反映されません。
        </Notice>
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
            requirement="optional"
            description="JPEG・PNG・WebP、2MBまで。保存後、表現確認を経て公開されます。"
          >
            <FileInput
              label={null}
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                startTransition(async () => {
                  const logoData = new FormData();
                  logoData.set("logo", file);
                  const result = await uploadLogo(logoData);
                  if (!result.ok) {
                    setMessage({ tone: "error", text: result.message });
                    return;
                  }
                  form.setFieldValue("content", (current) => ({ ...current, logoUrl: result.url }));
                  setMessage({
                    tone: "success",
                    text: "ロゴをアップロードしました。下書き保存または表現確認への送信をしてください。",
                  });
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
                    onClick={() => form.setFieldValue("content", { ...content, logoUrl: "" })}
                  >
                    ロゴを外す
                  </Button>
                </>
              ) : (
                `現在：未設定（頭文字「${name.slice(0, 1)}」を表示中）`
              )}
            </div>
          </Field>
          <Textarea
            label="会社紹介"
            rows={7}
            value={content.profileText}
            onChange={(event) =>
              form.setFieldValue("content", { ...content, profileText: event.target.value })
            }
            disabled={pending}
          />
          <Input
            label="公式サイトURL"
            type="url"
            value={content.websiteUrl}
            onChange={(event) =>
              form.setFieldValue("content", { ...content, websiteUrl: event.target.value })
            }
            disabled={pending}
          />
        </>
      )}
      <FormActions>
        {pendingVersion ? (
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                if (await withdrawManufacturerProfile(pendingVersion)) router.refresh();
                else
                  setMessage({
                    tone: "error",
                    text: "取り下げできませんでした。再読み込みして確認してください。",
                  });
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
                  setMessage({ tone: "error", text: "URLの入力を確認してください。" });
                  return;
                }
                setPreview(!preview);
              }}
            >
              {preview ? "編集に戻る" : "プレビュー"}
            </Button>
          </>
        )}
      </FormActions>
    </div>
  );
}
