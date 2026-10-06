import Link from "next/link";
import type { CSSProperties } from "react";

import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { PREFECTURES } from "@/lib/prefectures";
import { STANDPOINTS } from "@/lib/standpoints";
import type { ProfileDetails } from "@/server/queries/profile-details";

import { MockExternalIcon } from "@/app/materials/[id]/_components/MockParts";

/** 見本の initials()。 */
function initials(name: string): string {
  const text = name.trim();
  return text ? text.slice(0, 1).toUpperCase() : "?";
}

/** リンクの表示名（見本は「ichigo-farm.com」のようにホスト名だけを出す）。 */
function linkLabel(url: string): string {
  const parsed = URL.parse(url);
  return parsed === null ? url : parsed.hostname.replace(/^www\./, "");
}

type MockProfileCardProps = {
  handle: string;
  avatarUrl: string | null;
  details: ProfileDetails;
  stats: ReadonlyArray<{ label: string; value: number }>;
  /** 本人のマイページ（未設定の項目に「＋ 〜を設定する」を出し、編集ボタンを置く）。 */
  editable?: boolean;
  /** 本人の公開プロフィール（`/users/{id}`）。渡したときだけカードの末尾に「公開プロフィールを見る」を出す。 */
  publicProfileHref?: string;
};

function TodoHint({ children, style }: { children: string; style?: CSSProperties }) {
  return (
    <Link className="todo-hint" href="/me/edit" style={style}>
      <span className="todo-ic" aria-hidden="true">
        ＋
      </span>
      {children}
    </Link>
  );
}

/**
 * 見本 S.mypage・S.profilePublic のプロフィールカード（`.card` の帯・アバター・名前・地域・所属・自己紹介・主な作目・リンク・数）。
 * 背景画像の欄は本番に無いため、見本の標準の背景（グラデーション）だけを出す。
 */
export function MockProfileCard({
  handle,
  avatarUrl,
  details,
  stats,
  editable = false,
  publicProfileHref,
}: MockProfileCardProps) {
  const standpoint = STANDPOINTS.find((item) => item.value === details.standpoint)?.label;
  const prefecture = PREFECTURES.find((item) => item.code === details.prefecture_code)?.name;

  return (
    <section className="card prof-card" aria-labelledby="profile-handle">
      <div className="prof-cover" aria-hidden="true" />
      <div style={{ padding: "0 18px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
          <span className="avatar prof-avatar" aria-hidden="true">
            {avatarUrl ? (
              <Image alt="" src={avatarUrl} width={76} height={76} sizes="76px" />
            ) : (
              initials(handle)
            )}
          </span>
          <div style={{ flex: 1, minWidth: 180, paddingBottom: 2 }}>
            <h1 className="prof-name" id="profile-handle">
              <span>{handle}</span>{" "}
              {standpoint ? (
                <span className="type-label" style={{ fontSize: 10, verticalAlign: 2 }}>
                  {standpoint}
                </span>
              ) : null}
            </h1>
            {editable && !avatarUrl ? <TodoHint>プロフィール画像を設定する</TodoHint> : null}
            {prefecture || details.affiliations.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                  marginTop: 5,
                }}
              >
                {prefecture ? (
                  <>
                    <span className="muted" style={{ fontSize: 11 }}>
                      地域
                    </span>
                    <span className="chip">
                      {prefecture}
                      {details.city ? ` ${details.city}` : ""}
                    </span>
                    {editable && !details.cityPublic ? (
                      <TodoHint style={{ margin: "0 0 0 4px", fontSize: 11.5 }}>
                        市区町村まで公開する場合はこちら
                      </TodoHint>
                    ) : null}
                  </>
                ) : null}
                {details.affiliations.length > 0 ? (
                  <>
                    <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>
                      所属
                    </span>
                    {details.affiliations.map((name) => (
                      <span key={name} className="aff-badge aff-blue">
                        {name}
                      </span>
                    ))}
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
          {editable ? (
            <Link
              className="btn btn-ghost btn-sm"
              href="/me/edit"
              style={{ flex: "0 0 auto", padding: "7px 16px", fontSize: 12, width: "auto" }}
            >
              プロフィールを編集<span className="sr-only">（表示情報を編集）</span>
            </Link>
          ) : null}
        </div>

        {details.bio ? (
          <p className="prof-bio">{details.bio}</p>
        ) : editable ? (
          <div style={{ marginTop: 12, fontSize: 12 }}>
            <span className="muted" style={{ fontSize: 11 }}>
              自己紹介
            </span>{" "}
            <TodoHint style={{ marginTop: 2 }}>自己紹介を追加する</TodoHint>
          </div>
        ) : null}

        {details.crops.length > 0 ? (
          <div
            className="prof-chip-wrap"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              marginTop: 9,
            }}
          >
            <span className="muted" style={{ fontSize: 11 }}>
              主な作目
            </span>
            {details.crops.map((crop) => (
              <span key={crop.id} className="chip">
                {crop.name}
              </span>
            ))}
          </div>
        ) : editable ? (
          <div style={{ marginTop: 9, fontSize: 12 }}>
            <span className="muted" style={{ fontSize: 11 }}>
              主な作目
            </span>{" "}
            <TodoHint style={{ marginTop: 2 }}>主な作目を追加する</TodoHint>
          </div>
        ) : null}

        {details.links.length > 0 ? (
          <div
            className="pf-links"
            style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 9, fontSize: 12 }}
          >
            {details.links.map((url) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                <MockExternalIcon /> {linkLabel(url)}
              </a>
            ))}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--line)",
            fontSize: 12,
          }}
        >
          {stats.map((stat) => (
            <span key={stat.label}>
              {stat.label} <b className="tnum">{stat.value}</b>
            </span>
          ))}
        </div>
        {editable || publicProfileHref ? (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 8,
            }}
          >
            {editable ? (
              <p className="muted" style={{ fontSize: 11, margin: 0 }}>
                {details.cityPublic ? "市区町村まで公開中" : "都道府県まで公開中"}
                。本名・連絡先は公開されません。
              </p>
            ) : null}
            {publicProfileHref ? (
              <Link
                href={publicProfileHref}
                style={{ fontSize: 12, fontWeight: 700, marginLeft: "auto" }}
              >
                公開プロフィールを見る →
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
