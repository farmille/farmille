"use client";

import { startTransition, useActionState, useReducer } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { PersistedInput } from "@/components/form";
import { MaterialIllustration } from "@/components/materials/MaterialIllustration";
import { useRouter } from "next/navigation";
import * as v from "valibot";
import { Button } from "@/components";
import {
  Checkbox,
  CheckboxGroup,
  FormActions,
  Input,
  Notice,
  Select,
  Textarea,
} from "@/components/form";
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
import { saveMaterialPage, withdrawMaterialPage } from "../editor-actions";
import { css } from "../../../../../styled-system/css";

const timingOptions = css({ mt: "3" });

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
const TIMING_OPTIONS = APPLICATION_TIMINGS.map((label, index) => ({ value: String(index), label }));

const LINK_GROUP_OPTIONS = [
  { value: "", label: "分類を選択してください" },
  ...MATERIAL_LINK_GROUPS,
] as const;

type EditorAction =
  | { type: "save"; content: Content; submit: boolean }
  | { type: "withdraw"; versionId: string };

type EditorState = {
  version: string | null;
  savedContent: string;
  message: { tone: "success" | "error"; text: string } | null;
};

export function MaterialPageEditor({
  materialId,
  initialContent,
  expectedVersion,
  pendingVersion,
  imageUrl,
}: {
  materialId: string;
  initialContent: Content;
  expectedVersion: string | null;
  pendingVersion: string | null;
  imageUrl: string | null;
}) {
  const form = useForm({ defaultValues: { content: initialContent } });
  const content = useStore(form.store, (state) => state.values.content);
  const [preview, setPreview] = useReducer((_: boolean, next: boolean) => next, false);

  const [previewError, setPreviewError] = useReducer(
    (_: string | null, next: string | null) => next,
    null,
  );

  const router = useRouter();

  const [state, submitAction, pending] = useActionState<EditorState, EditorAction>(
    async (current, action) => {
      if (action.type === "withdraw") {
        if (await withdrawMaterialPage(action.versionId)) {
          router.refresh();

          return { ...current, message: null };
        }

        return {
          ...current,
          message: {
            tone: "error",
            text: "取り下げできませんでした。再読み込みして状態を確認してください。",
          },
        };
      }

      const result = await saveMaterialPage({
        materialId,
        expectedVersion: current.version,
        content: action.content,
        submit: action.submit,
      });

      if (!result.ok) return { ...current, message: { tone: "error", text: result.message } };
      router.refresh();

      return {
        version: action.submit ? null : result.versionId,
        savedContent: JSON.stringify(action.content),
        message: {
          tone: "success",
          text: action.submit
            ? "表現確認へ送りました。公開中の内容はまだ変わりません。"
            : "下書きを保存しました。",
        },
      };
    },
    { version: expectedVersion, savedContent: JSON.stringify(initialContent), message: null },
  );

  const message = previewError ? { tone: "error" as const, text: previewError } : state.message;

  const persistedInput = (
    <PersistedInput
      name="material-page"
      schema={MaterialPageContentSchema}
      unsaved={pendingVersion || JSON.stringify(content) === state.savedContent ? null : content}
      // 表現確認中は編集できないので、保存前の入力を戻さない
      restore={(restored) => {
        if (!pendingVersion) form.setFieldValue("content", restored);
      }}
    />
  );

  function save(submit: boolean) {
    setPreviewError(null);
    startTransition(() => submitAction({ type: "save", content, submit }));
  }

  if (pendingVersion)
    return (
      <div className={materialPageStack}>
        {persistedInput}
        <Notice tone="info">表現確認中です。公開内容は確認完了後に変わります。</Notice>
        <MaterialPageContent content={content} imageUrl={imageUrl} />
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(() => submitAction({ type: "withdraw", versionId: pendingVersion }))
          }
        >
          取り下げて編集を再開
        </Button>
      </div>
    );

  return (
    <div className={materialPageStack}>
      {persistedInput}
      <p>枠の中を編集すると、同じ項目が資材ページに表示されます。下書きは公開されません。</p>
      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      {preview ? (
        <MaterialPageContent content={content} imageUrl={imageUrl} />
      ) : (
        <fieldset className={fieldset} disabled={pending}>
          <div className={materialPageStack}>
            <section>
              <h2>製品画像</h2>
              <MaterialIllustration imageUrl={imageUrl} />
            </section>
            <section>
              <h2>製品説明</h2>
              <Textarea
                label="製品説明"
                hideLabel
                description={
                  <>
                    <a href={BS_GUIDELINE_URL} target="_blank" rel="noreferrer">
                      {BS_GUIDELINE_TITLE}
                    </a>
                    に沿ってご記入ください。公開前に運営が表現を確認します。
                  </>
                }
                rows={7}
                value={content.description}
                onChange={(event) =>
                  form.setFieldValue("content", { ...content, description: event.target.value })
                }
              />
            </section>
            <section>
              <h2>施用タイミング</h2>
              <p>共通の目安となる時期を複数選択できます。</p>
              <div className={timingOptions}>
                <CheckboxGroup
                  hideLabel
                  label="施用タイミング"
                  disabled={pending}
                  onValueChange={(values) =>
                    form.setFieldValue("content", { ...content, timings: values.map(Number) })
                  }
                  options={TIMING_OPTIONS}
                  value={content.timings.map(String)}
                  variant="chips"
                />
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
                        <Select
                          label="資料の分類"
                          labelSize="sm"
                          disabled={pending}
                          options={LINK_GROUP_OPTIONS}
                          value={link.group ?? ""}
                          onValueChange={(value) => {
                            form.setFieldValue("content", {
                              ...content,
                              links: content.links.map((entry, i) =>
                                i === index
                                  ? {
                                      ...entry,
                                      group: value === "" || value === null ? null : value,
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
                        />
                        <Input
                          label="資料名"
                          labelSize="sm"
                          value={link.title}
                          onChange={(event) =>
                            form.setFieldValue("content", {
                              ...content,
                              links: content.links.map((entry, i) =>
                                i === index ? { ...entry, title: event.target.value } : entry,
                              ),
                            })
                          }
                        />
                        <Input
                          label="資料URL"
                          labelSize="sm"
                          type="url"
                          value={link.url}
                          onChange={(event) =>
                            form.setFieldValue("content", {
                              ...content,
                              links: content.links.map((entry, i) =>
                                i === index ? { ...entry, url: event.target.value } : entry,
                              ),
                            })
                          }
                        />
                        {link.trial ? (
                          <>
                            {(
                              [
                                { key: "crops", label: "試験の作目（任意）" },
                                { key: "summary", label: "試験の概要（任意）" },
                                { key: "institution", label: "試験の実施機関（任意）" },
                              ] as const
                            ).map((field) => (
                              <Textarea
                                key={field.key}
                                label={field.label}
                                labelSize="sm"
                                rows={field.key === "summary" ? 3 : 1}
                                value={link.trial?.[field.key] ?? ""}
                                onChange={(event) =>
                                  form.setFieldValue("content", {
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
                              <Input
                                key={field.key}
                                label={field.label}
                                labelSize="sm"
                                type="number"
                                min={1}
                                max={field.max}
                                step={1}
                                value={link.trial?.[field.key] ?? ""}
                                onChange={(event) =>
                                  form.setFieldValue("content", {
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
                            ))}
                          </>
                        ) : null}
                        <Button
                          variant="ghost"
                          onClick={() =>
                            form.setFieldValue("content", {
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
                      form.setFieldValue("content", {
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
                  <Select
                    label="施用方法"
                    labelSize="sm"
                    disabled={pending}
                    options={APPLICATION_METHODS}
                    value={usage.method}
                    onValueChange={(method) => {
                      if (method === null) return;
                      form.setFieldValue("content", {
                        ...content,
                        usages: content.usages.map((entry, i) =>
                          i === index ? { ...entry, method } : entry,
                        ),
                      });
                    }}
                  />
                  <Textarea
                    label="詳細"
                    labelSize="sm"
                    rows={3}
                    value={usage.detail}
                    onChange={(event) =>
                      form.setFieldValue("content", {
                        ...content,
                        usages: content.usages.map((entry, i) =>
                          i === index ? { ...entry, detail: event.target.value } : entry,
                        ),
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    onClick={() =>
                      form.setFieldValue("content", {
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
                  form.setFieldValue("content", {
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
              <Textarea
                label="主な成分"
                value={content.mainComponents}
                onChange={(event) =>
                  form.setFieldValue("content", { ...content, mainComponents: event.target.value })
                }
              />
              <Textarea
                label="作用機作"
                rows={4}
                value={content.mechanism}
                onChange={(event) =>
                  form.setFieldValue("content", { ...content, mechanism: event.target.value })
                }
              />
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
                    <Checkbox
                      checked={Boolean(registration)}
                      disabled={pending}
                      onCheckedChange={(checked) =>
                        form.setFieldValue("content", {
                          ...content,
                          registrations: checked
                            ? [
                                ...content.registrations,
                                { kind: kind.value, companyName: "", effects: "" },
                              ]
                            : content.registrations.filter((entry) => entry.kind !== kind.value),
                        })
                      }
                    >
                      {kind.label}
                    </Checkbox>
                    {registration ? (
                      <>
                        <Input
                          label={kind.companyLabel}
                          value={registration.companyName}
                          onChange={(event) =>
                            form.setFieldValue("content", {
                              ...content,
                              registrations: content.registrations.map((entry) =>
                                entry.kind === kind.value
                                  ? { ...entry, companyName: event.target.value }
                                  : entry,
                              ),
                            })
                          }
                        />
                        <Textarea
                          label={kind.effectsLabel}
                          rows={3}
                          value={registration.effects}
                          onChange={(event) =>
                            form.setFieldValue("content", {
                              ...content,
                              registrations: content.registrations.map((entry) =>
                                entry.kind === kind.value
                                  ? { ...entry, effects: event.target.value }
                                  : entry,
                              ),
                            })
                          }
                        />
                      </>
                    ) : null}
                  </div>
                );
              })}
              <h3>その他の登録・認証</h3>
              <p>有機JAS適合など、上記以外の情報を1件ずつ記入してください。</p>
              {content.certifications.map((title, index) => (
                <div className={row} key={index}>
                  <Input
                    hideLabel
                    label={`登録・認証${index + 1}`}
                    value={title}
                    onChange={(event) =>
                      form.setFieldValue("content", {
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
                      form.setFieldValue("content", {
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
                  form.setFieldValue("content", {
                    ...content,
                    certifications: [...content.certifications, ""],
                  })
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
                  <Input
                    label={`関係会社${index + 1}`}
                    labelSize="sm"
                    value={company}
                    onChange={(event) =>
                      form.setFieldValue("content", {
                        ...content,
                        relatedCompanies: content.relatedCompanies.map((name, i) =>
                          i === index ? event.target.value : name,
                        ),
                      })
                    }
                  />
                  <Button
                    variant="ghost"
                    onClick={() =>
                      form.setFieldValue("content", {
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
                  form.setFieldValue("content", {
                    ...content,
                    relatedCompanies: [...content.relatedCompanies, ""],
                  })
                }
              >
                関係会社を追加
              </Button>
            </section>
          </div>
        </fieldset>
      )}
      <FormActions>
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
              setPreviewError(
                "プレビューの前に、資料のタイトル・URLと登録・認証の空欄を確認してください。",
              );

              return;
            }

            setPreview(!preview);
          }}
        >
          {preview ? "編集に戻る" : "プレビュー"}
        </Button>
      </FormActions>
      <p>
        保存すると変更履歴に記録されます。メーカーが掲載内容の管理と責任を持ち、運営は表現の確認と監査を行います。
      </p>
    </div>
  );
}
