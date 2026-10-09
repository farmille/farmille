"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState } from "react";

import {
  adminActionsStyle,
  adminCodeStyle,
  adminInlineNoteStyle,
} from "@/app/admin/_components/AdminUI";
import { initialSellerActionState } from "@/app/admin/_lib/action-state";
import { sellerOperationAction } from "@/app/admin/sellers/[id]/actions";
import { Button, Textarea } from "@/components";
import { Field, Input, Notice, Select } from "@/components/form";
import { css } from "../../../../../styled-system/css";

const wrapStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
});

const credentialsStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "4",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  p: "5",
});

const credentialLabelStyle = css({
  fontSize: "sm",
  fontWeight: "bold",
  color: "primary.700",
});

const confirmationStyle = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "2.5",
});

const fieldLabelStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "1.5",
  fontSize: "sm",
  fontWeight: "bold",
  color: "text.muted",
});

type Operation = "approve" | "reject" | "suspend" | "reinstate" | "invite";

/** 取り消せない操作は一度だけ確認を挟む（却下・凍結）。 */
const CONFIRM_MESSAGES = {
  reject: { note: "この申請を却下します。取り消せません。", label: "却下する" },
  suspend: {
    note: "このアカウントを凍結します。メーカーはログインできなくなります。",
    label: "凍結する",
  },
} satisfies Record<"reject" | "suspend", { note: string; label: string }>;

export function SellerReviewActions({
  sellerId,
  status,
  inviteCode,
  manufacturerNames,
}: {
  sellerId: string;
  status: string;
  inviteCode: string | null;
  manufacturerNames: string[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    sellerOperationAction,
    initialSellerActionState,
  );
  const [confirming, setConfirming] = useState<"reject" | "suspend" | null>(null);
  const [rejectedReason, setRejectedReason] = useState("");
  const [submitting, setSubmitting] = useState<Operation | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);
  const [newManufacturerName, setNewManufacturerName] = useState("");

  useEffect(() => {
    if (state.status === "approved") {
      // RSCだけを更新するため、初期パスワードを持つClient stateは保持される。
      router.refresh();
    }
  }, [router, state.status]);

  const submit = (operation: Operation): void => {
    const formData = new FormData();
    formData.set("sellerId", sellerId);
    formData.set("operation", operation);
    if (operation === "approve") {
      formData.set(
        "manufacturerName",
        selectedManufacturer === "__new__" ? newManufacturerName : (selectedManufacturer ?? ""),
      );
      formData.set("createManufacturer", String(selectedManufacturer === "__new__"));
    }
    if (operation === "reject") {
      formData.set("rejectedReason", rejectedReason);
    }
    setSubmitting(operation);
    setConfirming(null);
    startTransition(() => {
      formAction(formData);
    });
  };

  const confirmation = confirming === null ? null : CONFIRM_MESSAGES[confirming];

  return (
    <div className={wrapStyle}>
      {status === "applied" && state.status !== "approved" ? (
        <div className={wrapStyle}>
          <Field label="紐づける資材メーカー" labelSize="sm">
            <Select
              disabled={pending}
              onValueChange={setSelectedManufacturer}
              options={[
                ...manufacturerNames.map((name) => ({ value: name, label: name })),
                { value: "__new__", label: "該当なし：メーカーを追加" },
              ]}
              placeholder="メーカーを選択してください"
              value={selectedManufacturer}
            />
          </Field>
          {selectedManufacturer === "__new__" ? (
            <Field label="新規メーカー名" labelSize="sm">
              <Input
                disabled={pending}
                maxLength={300}
                onChange={(event) => setNewManufacturerName(event.target.value)}
                value={newManufacturerName}
              />
            </Field>
          ) : null}
          <p className={adminInlineNoteStyle}>
            アカウントの確認後にログインを発行します。この操作では編集権は付与されません。メーカーが提出する掲載・オーナー権限の申請と確認資料を審査してから、資材ごとに編集権を付与してください。
          </p>
        </div>
      ) : null}
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {state.status === "done" ? <Notice tone="success">{state.message}</Notice> : null}

      {state.status === "approved" ? (
        <div className={credentialsStyle}>
          <p className={credentialLabelStyle}>ログインIDとパスワード設定用の案内を発行しました。</p>
          <div className={css({ display: "grid", gap: "2" })}>
            <span className={adminInlineNoteStyle}>ログインID</span>
            <span className={adminCodeStyle}>{state.credentials.loginId}</span>
          </div>
          <div className={css({ display: "grid", gap: "2" })}>
            <span className={adminInlineNoteStyle}>パスワード設定用URL</span>
            <span className={adminCodeStyle}>{state.credentials.passwordSetupUrl}</span>
          </div>
          <p className={adminInlineNoteStyle}>
            {state.credentials.emailSent
              ? "ログインIDとパスワード設定用URLを申請時の連絡先へ送信しました。メーカーはログイン後、掲載・オーナー権限の申請フォームから手続きできます。"
              : "承認は完了しましたが、案内メールを送信できませんでした。上記のログインIDとURLを申請時の連絡先へ送付してください。期限切れの場合はメーカーのパスワード再設定画面から再送できます。"}
          </p>
        </div>
      ) : null}

      {state.status === "invited" ? (
        <div className={credentialsStyle}>
          <p className={credentialLabelStyle}>招待コードを発行しました。</p>
          <span className={adminCodeStyle}>{state.inviteCode}</span>
        </div>
      ) : null}

      {state.status === "approved" ? null : confirmation === null ? (
        <div className={adminActionsStyle}>
          {status === "applied" ? (
            <>
              <Button
                disabled={
                  pending ||
                  selectedManufacturer === null ||
                  (selectedManufacturer === "__new__" && newManufacturerName.trim().length === 0)
                }
                onClick={() => submit("approve")}
                size="sm"
              >
                {pending && submitting === "approve"
                  ? "共有ログインを発行中…"
                  : "確認を完了してログインを発行"}
              </Button>
              <Button
                disabled={pending}
                onClick={() => setConfirming("reject")}
                size="sm"
                variant="danger"
              >
                却下
              </Button>
            </>
          ) : null}
          {status === "approved" ? (
            <Button
              disabled={pending}
              onClick={() => setConfirming("suspend")}
              size="sm"
              variant="danger"
            >
              凍結する
            </Button>
          ) : null}
          {status === "suspended" ? (
            <Button disabled={pending} onClick={() => submit("reinstate")} size="sm">
              凍結を解除する
            </Button>
          ) : null}
          <Button disabled={pending} onClick={() => submit("invite")} size="sm" variant="ghost">
            {inviteCode === null ? "招待コードを発行" : "招待コードを再発行"}
          </Button>
        </div>
      ) : (
        <div className={confirmationStyle}>
          <p className={adminInlineNoteStyle}>{confirmation.note}</p>
          {confirming === "reject" ? (
            <label className={fieldLabelStyle}>
              却下理由
              <Textarea
                autoFocus
                name="rejectedReason"
                onChange={(event) => setRejectedReason(event.target.value)}
                placeholder="申請者へ伝える判断理由を入力"
                required
                value={rejectedReason}
              />
            </label>
          ) : null}
          <div className={adminActionsStyle}>
            <Button
              disabled={pending || (confirming === "reject" && rejectedReason.trim().length === 0)}
              onClick={() => submit(confirming ?? "reject")}
              size="sm"
              variant="danger"
            >
              {confirmation.label}
            </Button>
            <Button onClick={() => setConfirming(null)} size="sm" variant="ghost">
              やめる
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
