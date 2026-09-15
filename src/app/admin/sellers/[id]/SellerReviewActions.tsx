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
import { Button, Input, Select, Textarea } from "@/components";
import { FormMessage } from "@/components/auth/Fields";
import { css } from "../../../../../styled-system/css";

const wrapStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
});

const credentialsStyle = css({
  display: "flex",
  flexDirection: "column",
  gap: "2",
  bg: "brand.soft",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  p: "3",
});

const credentialLabelStyle = css({
  fontSize: "sm",
  fontWeight: "700",
  color: "brand.primaryDeep",
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
  fontWeight: "700",
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
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
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
        selectedManufacturer === "__new__" ? newManufacturerName : selectedManufacturer,
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
          <label className={fieldLabelStyle}>
            紐づける資材メーカー
            <Select
              value={selectedManufacturer}
              onChange={(event) => setSelectedManufacturer(event.target.value)}
              disabled={pending}
            >
              <option value="">メーカーを選択してください</option>
              {manufacturerNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              <option value="__new__">該当なし：メーカーを追加</option>
            </Select>
          </label>
          {selectedManufacturer === "__new__" ? (
            <label className={fieldLabelStyle}>
              新規メーカー名
              <Input
                value={newManufacturerName}
                onChange={(event) => setNewManufacturerName(event.target.value)}
                maxLength={300}
                disabled={pending}
              />
            </label>
          ) : null}
          <p className={adminInlineNoteStyle}>
            アカウントの確認後にログインを発行します。この操作では編集権は付与されません。掲載ページの候補一覧と編集権の申込書類をメールで送り、返送書類を確認してから資材ごとに編集権を付与してください。
          </p>
        </div>
      ) : null}
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {state.status === "done" ? <FormMessage tone="info">{state.message}</FormMessage> : null}

      {state.status === "approved" ? (
        <div className={credentialsStyle}>
          <p className={credentialLabelStyle}>ログインIDとパスワード設定用の案内を発行しました。</p>
          <div>
            <span className={adminInlineNoteStyle}>ログインID</span>
            <br />
            <span className={adminCodeStyle}>{state.credentials.loginId}</span>
          </div>
          <div>
            <span className={adminInlineNoteStyle}>パスワード設定用URL</span>
            <br />
            <span className={adminCodeStyle}>{state.credentials.passwordSetupUrl}</span>
          </div>
          <p className={adminInlineNoteStyle}>
            このURLを、掲載ページの候補一覧と編集権の申込書類とともに、申請時の連絡先へ手動でメール送付してください。期限切れの場合はメーカーのパスワード再設定画面から再送できます。
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
                  selectedManufacturer.length === 0 ||
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
