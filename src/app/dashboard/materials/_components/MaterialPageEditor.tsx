"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as v from "valibot";
import { Button } from "@/components";
import { Field, FormMessage, controlStyle } from "@/components/auth/Fields";
import { MaterialPageContent, materialPageStack } from "@/components/materials/MaterialPageContent";
import {
  APPLICATION_METHODS,
  APPLICATION_TIMINGS,
  MATERIAL_LINK_GROUPS,
  MATERIAL_REGISTRATION_KINDS,
  MaterialPageContentSchema,
  type MaterialPageContent as Content,
} from "@/lib/material-page-editor";
import { BS_GUIDELINE_TITLE, BS_GUIDELINE_URL } from "@/lib/manufacturer-policy";
import { createAuthBrowserClient } from "@/lib/auth/browser";
import { saveMaterialPage, withdrawMaterialPage } from "../editor-actions";
import { css } from "../../../../../styled-system/css";

const actions = css({ display: "flex", gap: "2", flexWrap: "wrap" });
const timingOptions = css({ display: "flex", flexWrap: "wrap", gap: "2", mt: "3" });
const timingOption = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "2",
  px: "3",
  py: "3",
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "pill",
  cursor: "pointer",
  "&:has(input:checked)": { bg: "primary.200", borderColor: "primary.600" },
});
const row = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
  my: "3",
  p: "3",
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "card",
});
const fieldset = css({ border: "0", p: "0", m: "0", minW: "0" });

export function MaterialPageEditor({
  materialId,
  sellerId,
  initialContent,
  expectedVersion,
  pendingVersion,
  initialImageSources,
}: {
  materialId: string;
  sellerId: string;
  initialContent: Content;
  expectedVersion: string | null;
  pendingVersion: string | null;
  initialImageSources: string[];
}) {
  const [content, setContent] = useState(initialContent);
  const [imageSources, setImageSources] = useState(initialImageSources);
  const [version, setVersion] = useState(expectedVersion);
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function save(submit: boolean) {
    startTransition(async () => {
      const result = await saveMaterialPage({
        materialId,
        expectedVersion: version,
        content,
        submit,
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setVersion(submit ? null : result.versionId);
      setMessage(
        submit
          ? "表現確認へ送りました。公開中の内容はまだ変わりません。"
          : "下書きを保存しました。",
      );
      router.refresh();
    });
  }

  function upload(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files);
    startTransition(async () => {
      const db = createAuthBrowserClient();
      for (const file of selected) {
        const extension = new Map([
          ["image/png", "png"],
          ["image/jpeg", "jpg"],
          ["image/webp", "webp"],
        ]).get(file.type);
        if (!extension || file.size > 10 * 1024 * 1024) {
          setMessage("画像はPNG・JPEG・WebP形式、1枚10MB以下で選択してください。");
          return;
        }
        const path = `${sellerId}/${materialId}/${crypto.randomUUID()}.${extension}`;
        const result = await db.storage
          .from("manufacturer-drafts")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (result.error) {
          setMessage("画像を追加できませんでした。編集権と通信状態を確認してください。");
          return;
        }
        const signed = await db.storage.from("manufacturer-drafts").createSignedUrl(path, 3600);
        if (signed.error) {
          setMessage("画像のプレビューを取得できませんでした。再度お試しください。");
          return;
        }
        setContent((current) => ({
          ...current,
          images: [...current.images, { path, alt: file.name }],
        }));
        setImageSources((current) => [...current, signed.data.signedUrl]);
      }
      setMessage("画像を追加しました。下書き保存または表現確認への送信で原稿に保存されます。");
    });
  }

  if (pendingVersion)
    return (
      <div className={materialPageStack}>
        <FormMessage tone="info">表現確認中です。公開内容は確認完了後に変わります。</FormMessage>
        <MaterialPageContent content={content} imageSources={imageSources} />
        {message ? <FormMessage tone="info">{message}</FormMessage> : null}
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              if (await withdrawMaterialPage(pendingVersion)) router.refresh();
              else setMessage("取り下げできませんでした。再読み込みして状態を確認してください。");
            })
          }
        >
          取り下げて編集を再開
        </Button>
      </div>
    );

  return (
    <div className={materialPageStack}>
      <p>枠の中を編集すると、同じ項目が資材ページに表示されます。下書きは公開されません。</p>
      {message ? <FormMessage tone="info">{message}</FormMessage> : null}
      {preview ? (
        <MaterialPageContent content={content} imageSources={imageSources} />
      ) : (
        <fieldset className={fieldset} disabled={pending}>
          <div className={materialPageStack}>
            <section>
              <h2>製品画像</h2>
              <p>先頭がメイン画像です。正面・白背景・正方形を推奨します。複数枚追加できます。</p>
              <input
                aria-label="製品画像を追加"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(event) => upload(event.target.files)}
              />
              {content.images.map((image, index) => (
                <div className={row} key={image.path}>
                  <Image
                    unoptimized
                    src={imageSources[index]}
                    alt={image.alt || "製品画像"}
                    width={160}
                    height={160}
                    className={css({ w: "imagePreview", h: "imagePreview", objectFit: "contain" })}
                  />
                  <label>
                    画像{index + 1}の説明
                    <input
                      className={controlStyle}
                      value={image.alt}
                      onChange={(event) =>
                        setContent({
                          ...content,
                          images: content.images.map((entry, i) =>
                            i === index ? { ...entry, alt: event.target.value } : entry,
                          ),
                        })
                      }
                    />
                  </label>
                  <div className={actions}>
                    <Button
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() => {
                        const images = [...content.images];
                        const sources = [...imageSources];
                        [images[index - 1], images[index]] = [images[index], images[index - 1]];
                        [sources[index - 1], sources[index]] = [sources[index], sources[index - 1]];
                        setContent({ ...content, images });
                        setImageSources(sources);
                      }}
                    >
                      前へ移動
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setContent({
                          ...content,
                          images: content.images.filter((_, i) => i !== index),
                        });
                        setImageSources(imageSources.filter((_, i) => i !== index));
                      }}
                    >
                      画像を外す
                    </Button>
                  </div>
                </div>
              ))}
            </section>
            <section>
              <h2>製品説明</h2>
              <textarea
                aria-label="製品説明"
                className={controlStyle}
                rows={7}
                value={content.description}
                onChange={(event) => setContent({ ...content, description: event.target.value })}
              />
              <p>
                <a href={BS_GUIDELINE_URL} target="_blank" rel="noreferrer">
                  {BS_GUIDELINE_TITLE}
                </a>
                に沿ってご記入ください。公開前に運営が表現を確認します。
              </p>
            </section>
            <section>
              <h2>施用タイミング</h2>
              <p>共通の目安となる時期を複数選択できます。</p>
              <div className={timingOptions}>
                {APPLICATION_TIMINGS.map((label, index) => (
                  <label className={timingOption} key={label}>
                    <input
                      type="checkbox"
                      checked={content.timings.includes(index)}
                      onChange={(event) =>
                        setContent({
                          ...content,
                          timings: event.target.checked
                            ? [...content.timings, index].sort((a, b) => a - b)
                            : content.timings.filter((timing) => timing !== index),
                        })
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </section>
            <section>
              <h2>リンク・資料</h2>
              {[{ value: null, label: "分類未選択" }, ...MATERIAL_LINK_GROUPS].map((group) => (
                <div key={group.value ?? "unclassified"}>
                  <h3>{group.label}</h3>
                  {content.links.map((link, index) =>
                    link.group === group.value ? (
                      <div className={row} key={index}>
                        <label>
                          資料の分類
                          <select
                            className={controlStyle}
                            value={link.group ?? ""}
                            onChange={(event) => {
                              const value = v.parse(
                                v.picklist([
                                  "",
                                  "overview",
                                  "safety",
                                  "technical",
                                  "public_trial",
                                  "other_trial",
                                ]),
                                event.target.value,
                              );
                              setContent({
                                ...content,
                                links: content.links.map((entry, i) =>
                                  i === index
                                    ? {
                                        ...entry,
                                        group: value === "" ? null : value,
                                        trial:
                                          value === "public_trial" || value === "other_trial"
                                            ? (entry.trial ?? {
                                                crops: "",
                                                summary: "",
                                                institution: "",
                                                year: null,
                                                pageCount: null,
                                              })
                                            : null,
                                      }
                                    : entry,
                                ),
                              });
                            }}
                          >
                            <option value="">分類を選択してください</option>
                            {MATERIAL_LINK_GROUPS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          資料名
                          <input
                            className={controlStyle}
                            value={link.title}
                            onChange={(event) =>
                              setContent({
                                ...content,
                                links: content.links.map((entry, i) =>
                                  i === index ? { ...entry, title: event.target.value } : entry,
                                ),
                              })
                            }
                          />
                        </label>
                        <label>
                          資料URL
                          <input
                            className={controlStyle}
                            type="url"
                            value={link.url}
                            onChange={(event) =>
                              setContent({
                                ...content,
                                links: content.links.map((entry, i) =>
                                  i === index ? { ...entry, url: event.target.value } : entry,
                                ),
                              })
                            }
                          />
                        </label>
                        {link.trial ? (
                          <>
                            {(
                              [
                                { key: "crops", label: "試験の作目（任意）" },
                                { key: "summary", label: "試験の概要" },
                                { key: "institution", label: "試験の実施機関" },
                              ] as const
                            ).map((field) => (
                              <label key={field.key}>
                                {field.label}
                                <textarea
                                  className={controlStyle}
                                  rows={field.key === "summary" ? 3 : 1}
                                  value={link.trial?.[field.key] ?? ""}
                                  onChange={(event) =>
                                    setContent({
                                      ...content,
                                      links: content.links.map((entry, i) =>
                                        i === index && entry.trial
                                          ? {
                                              ...entry,
                                              trial: {
                                                ...entry.trial,
                                                [field.key]: event.target.value,
                                              },
                                            }
                                          : entry,
                                      ),
                                    })
                                  }
                                />
                              </label>
                            ))}
                            {(
                              [
                                { key: "year", label: "試験実施年（任意）", max: 9999 },
                                {
                                  key: "pageCount",
                                  label: "資料のページ数（任意）",
                                  max: 2147483647,
                                },
                              ] as const
                            ).map((field) => (
                              <label key={field.key}>
                                {field.label}
                                <input
                                  className={controlStyle}
                                  type="number"
                                  min={1}
                                  max={field.max}
                                  step={1}
                                  value={link.trial?.[field.key] ?? ""}
                                  onChange={(event) =>
                                    setContent({
                                      ...content,
                                      links: content.links.map((entry, i) =>
                                        i === index && entry.trial
                                          ? {
                                              ...entry,
                                              trial: {
                                                ...entry.trial,
                                                [field.key]:
                                                  event.target.value === ""
                                                    ? null
                                                    : event.target.valueAsNumber,
                                              },
                                            }
                                          : entry,
                                      ),
                                    })
                                  }
                                />
                              </label>
                            ))}
                          </>
                        ) : null}
                        <Button
                          variant="ghost"
                          onClick={() =>
                            setContent({
                              ...content,
                              links: content.links.filter((_, i) => i !== index),
                            })
                          }
                        >
                          資料を外す
                        </Button>
                      </div>
                    ) : null,
                  )}
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setContent({
                        ...content,
                        links: [
                          ...content.links,
                          {
                            group: group.value,
                            title: "",
                            url: "",
                            trial:
                              group.value === "public_trial" || group.value === "other_trial"
                                ? {
                                    crops: "",
                                    summary: "",
                                    institution: "",
                                    year: null,
                                    pageCount: null,
                                  }
                                : null,
                          },
                        ],
                      })
                    }
                  >
                    資料を追加
                  </Button>
                </div>
              ))}
            </section>
            <section>
              <h2>施用方法</h2>
              {content.usages.map((usage, index) => (
                <div className={row} key={index}>
                  <label>
                    施用方法
                    <select
                      className={controlStyle}
                      value={usage.method}
                      onChange={(event) => {
                        const method = v.parse(
                          v.picklist(["spray", "drench", "mix", "soak", "coat", "other"]),
                          event.target.value,
                        );
                        setContent({
                          ...content,
                          usages: content.usages.map((entry, i) =>
                            i === index ? { ...entry, method } : entry,
                          ),
                        });
                      }}
                    >
                      {APPLICATION_METHODS.map((method) => (
                        <option value={method.value} key={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    詳細
                    <textarea
                      className={controlStyle}
                      rows={3}
                      value={usage.detail}
                      onChange={(event) =>
                        setContent({
                          ...content,
                          usages: content.usages.map((entry, i) =>
                            i === index ? { ...entry, detail: event.target.value } : entry,
                          ),
                        })
                      }
                    />
                  </label>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setContent({
                        ...content,
                        usages: content.usages.filter((_, i) => i !== index),
                      })
                    }
                  >
                    記入枠を外す
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                onClick={() =>
                  setContent({
                    ...content,
                    usages: [...content.usages, { method: "other", detail: "" }],
                  })
                }
              >
                記入枠を追加
              </Button>
            </section>
            <section>
              <h2>製品詳細</h2>
              <Field label="主な成分" htmlFor="material-components">
                <textarea
                  id="material-components"
                  className={controlStyle}
                  value={content.mainComponents}
                  onChange={(event) =>
                    setContent({ ...content, mainComponents: event.target.value })
                  }
                />
              </Field>
              <Field label="作用機作" htmlFor="material-mechanism">
                <textarea
                  id="material-mechanism"
                  className={controlStyle}
                  rows={4}
                  value={content.mechanism}
                  onChange={(event) => setContent({ ...content, mechanism: event.target.value })}
                />
              </Field>
            </section>
            <section>
              <h2>登録・認証</h2>
              <p>該当する区分を選び、事業者名と表示できる効果・特徴を記入してください。</p>
              {MATERIAL_REGISTRATION_KINDS.map((kind) => {
                const registration = content.registrations.find(
                  (entry) => entry.kind === kind.value,
                );
                return (
                  <div className={row} key={kind.value}>
                    <label className={timingOption}>
                      <input
                        type="checkbox"
                        checked={Boolean(registration)}
                        onChange={(event) =>
                          setContent({
                            ...content,
                            registrations: event.target.checked
                              ? [
                                  ...content.registrations,
                                  { kind: kind.value, companyName: "", effects: "" },
                                ]
                              : content.registrations.filter((entry) => entry.kind !== kind.value),
                          })
                        }
                      />
                      {kind.label}
                    </label>
                    {registration ? (
                      <>
                        <Field
                          label={kind.companyLabel}
                          htmlFor={`registration-${kind.value}-company`}
                        >
                          <input
                            id={`registration-${kind.value}-company`}
                            className={controlStyle}
                            value={registration.companyName}
                            onChange={(event) =>
                              setContent({
                                ...content,
                                registrations: content.registrations.map((entry) =>
                                  entry.kind === kind.value
                                    ? { ...entry, companyName: event.target.value }
                                    : entry,
                                ),
                              })
                            }
                          />
                        </Field>
                        <Field
                          label={kind.effectsLabel}
                          htmlFor={`registration-${kind.value}-effects`}
                        >
                          <textarea
                            id={`registration-${kind.value}-effects`}
                            className={controlStyle}
                            rows={3}
                            value={registration.effects}
                            onChange={(event) =>
                              setContent({
                                ...content,
                                registrations: content.registrations.map((entry) =>
                                  entry.kind === kind.value
                                    ? { ...entry, effects: event.target.value }
                                    : entry,
                                ),
                              })
                            }
                          />
                        </Field>
                      </>
                    ) : null}
                  </div>
                );
              })}
              <h3>その他の登録・認証</h3>
              <p>有機JAS適合など、上記以外の情報を1件ずつ記入してください。</p>
              {content.certifications.map((title, index) => (
                <div className={row} key={index}>
                  <input
                    aria-label={`登録・認証${index + 1}`}
                    className={controlStyle}
                    value={title}
                    onChange={(event) =>
                      setContent({
                        ...content,
                        certifications: content.certifications.map((entry, i) =>
                          i === index ? event.target.value : entry,
                        ),
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setContent({
                        ...content,
                        certifications: content.certifications.filter((_, i) => i !== index),
                      })
                    }
                  >
                    登録・認証を外す
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                onClick={() =>
                  setContent({ ...content, certifications: [...content.certifications, ""] })
                }
              >
                登録・認証を追加
              </Button>
            </section>
            <section>
              <h2>関係会社（販売元、製造元、輸入元など）</h2>
              <p>掲載する会社名を1社ずつ記入してください。</p>
              {content.relatedCompanies.map((company, index) => (
                <div className={row} key={index}>
                  <label>
                    関係会社{index + 1}
                    <input
                      className={controlStyle}
                      value={company}
                      onChange={(event) =>
                        setContent({
                          ...content,
                          relatedCompanies: content.relatedCompanies.map((name, i) =>
                            i === index ? event.target.value : name,
                          ),
                        })
                      }
                    />
                  </label>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setContent({
                        ...content,
                        relatedCompanies: content.relatedCompanies.filter((_, i) => i !== index),
                      })
                    }
                  >
                    関係会社を外す
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                onClick={() =>
                  setContent({ ...content, relatedCompanies: [...content.relatedCompanies, ""] })
                }
              >
                関係会社を追加
              </Button>
            </section>
          </div>
        </fieldset>
      )}
      <div className={actions}>
        <Button disabled={pending} onClick={() => save(true)}>
          保存して表現確認へ送る
        </Button>
        <Button variant="ghost" disabled={pending} onClick={() => save(false)}>
          下書きを保存
        </Button>
        <Button
          variant="ghost"
          disabled={pending}
          onClick={() => {
            if (!preview && !v.is(MaterialPageContentSchema, content)) {
              setMessage(
                "プレビューの前に、資料のタイトル・URLと登録・認証の空欄を確認してください。",
              );
              return;
            }
            setPreview(!preview);
          }}
        >
          {preview ? "編集に戻る" : "プレビュー"}
        </Button>
      </div>
      <p>
        保存すると変更履歴に記録されます。メーカーが掲載内容の管理と責任を持ち、運営は表現の確認と監査を行います。
      </p>
    </div>
  );
}
