"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as v from "valibot";
import { Button } from "@/components";
import { Field, FormMessage, controlStyle } from "@/components/auth/Fields";
import { materialPageStack } from "@/components/materials/MaterialPageContent";
import { SellerHeader } from "@/app/sellers/[id]/_components/SellerHeader";
import {
  ManufacturerProfileSchema,
  type ManufacturerProfileContent,
} from "@/lib/manufacturer-profile";
import { saveManufacturerProfile, withdrawManufacturerProfile } from "./actions";

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
          <Field label="会社紹介" htmlFor="profile-text">
            <textarea
              className={controlStyle}
              id="profile-text"
              rows={7}
              value={content.profileText}
              onChange={(event) => setContent({ ...content, profileText: event.target.value })}
              disabled={pending}
            />
          </Field>
          <Field
            label="ロゴ画像URL"
            htmlFor="profile-logo"
            guide="公開しているロゴ画像のURLを入力してください。"
          >
            <input
              className={controlStyle}
              id="profile-logo"
              type="url"
              value={content.logoUrl}
              onChange={(event) => setContent({ ...content, logoUrl: event.target.value })}
              disabled={pending}
            />
          </Field>
          <Field label="公式サイトURL" htmlFor="profile-site">
            <input
              className={controlStyle}
              id="profile-site"
              type="url"
              value={content.websiteUrl}
              onChange={(event) => setContent({ ...content, websiteUrl: event.target.value })}
              disabled={pending}
            />
          </Field>
        </>
      )}
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
  );
}
