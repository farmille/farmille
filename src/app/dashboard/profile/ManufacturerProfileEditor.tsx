"use client";
import "../../_mock/forms.css";
import "../../_mock/dashboard.css";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as v from "valibot";
import { FormNotice } from "@/app/_mock/FormParts";
import { SellerHeader } from "@/app/sellers/[id]/_components/SellerHeader";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import {
  ManufacturerProfileSchema,
  type ManufacturerProfileContent,
} from "@/lib/manufacturer-profile";
import { saveManufacturerProfile, withdrawManufacturerProfile, uploadLogo } from "./actions";

/** 見本 S.makerDash の tabProfile（ロゴの .md-slot、会社紹介・公式サイトの card、.md-save の保存行）。 */
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
    <div className="dash-preview">
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
        <div className="card pad dash-draft-note">
          <b>未公開の下書きを編集中です。</b>
          <span className="muted">表現確認を経るまで、メーカーページには反映されません。</span>
        </div>
      ) : null}
      {preview || pendingVersion ? (
        sellerPreview
      ) : (
        <>
          <div className="md-slots dash-slots">
            <div className="md-slot">
              <label className="ph" htmlFor="profile-logo">
                ＋<br />
                企業ロゴをアップロード<span className="sr-only">（ロゴ画像・任意）</span>
                <input
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
              <div className="req" id="profile-logo-req">
                JPEG / PNG / WebP ・ 2MBまで。保存後、表現確認を経て公開されます。
              </div>
              <div className="now muted dash-logo-now">
                {content.logoUrl ? (
                  <>
                    <Image alt="" src={content.logoUrl} width={48} height={48} sizes="48px" />
                    現在：設定した画像を表示中
                    <button
                      type="button"
                      className="md-btn ghost"
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
          <div className="card">
            <div className="field dash-field">
              <label htmlFor="profile-text">会社紹介</label>
              <textarea
                className="textarea"
                id="profile-text"
                rows={7}
                style={{ minHeight: 96 }}
                value={content.profileText}
                onChange={(event) => setContent({ ...content, profileText: event.target.value })}
                disabled={pending}
              />
            </div>
            <div className="field dash-field">
              <label htmlFor="profile-site">公式サイトURL</label>
              <input
                className="input"
                id="profile-site"
                type="url"
                value={content.websiteUrl}
                onChange={(event) => setContent({ ...content, websiteUrl: event.target.value })}
                disabled={pending}
              />
            </div>
          </div>
        </>
      )}
      <div className="card" style={{ marginTop: 12 }}>
        <div className="md-save dash-save">
          {pendingVersion ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
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
                className="btn btn-primary btn-sm"
                disabled={pending}
                onClick={() => save(true)}
              >
                保存して表現確認へ送る
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={pending}
                onClick={() => save(false)}
              >
                下書きを保存
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
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
