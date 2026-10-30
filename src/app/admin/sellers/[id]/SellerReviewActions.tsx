"use client";

import { useRouter } from "next/navigation";
import { startTransition, useActionState, useReducer } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import {
  adminActionsStyle,
  adminCodeStyle,
  adminInlineNoteStyle,
} from "@/app/admin/_components/AdminUI";
import { initialSellerActionState, type SellerActionState } from "@/app/admin/_lib/action-state";
import { sellerOperationAction } from "@/app/admin/sellers/[id]/actions";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Input, Notice, Select, Textarea } from "@/components/form";
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
  color: "text.brand",
});

type SellerApprovalInput = {
  selectedManufacturer: string | null;
  newManufacturerName: string;
  rejectedReason: string;
};

type Operation = "approve" | "reject" | "suspend" | "reinstate" | "invite";

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
    async (previous: SellerActionState, formData: FormData) => {
      const next = await sellerOperationAction(previous, formData);

      // RSCだけを更新し、初期パスワードを持つクライアント状態を保持する。
      if (next.status === "approved") router.refresh();

      return next;
    },
    initialSellerActionState,
  );

  const [submitting, setSubmitting] = useReducer(
    (_state: Operation | null, next: Operation | null) => next,
    null,
  );

  const initialValues: SellerApprovalInput = {
    selectedManufacturer: null,
    newManufacturerName: "",
    rejectedReason: "",
  };

  const form = useForm({ defaultValues: initialValues });

  const { selectedManufacturer, newManufacturerName, rejectedReason } = useStore(
    form.store,
    (state) => state.values,
  );

  const submit = (operation: Operation, formData = new FormData()): void => {
    formData.set("sellerId", sellerId);
    formData.set("operation", operation);

    if (operation === "approve") {
      formData.set(
        "manufacturerName",
        selectedManufacturer === "__new__" ? newManufacturerName : (selectedManufacturer ?? ""),
      );
      formData.set("createManufacturer", String(selectedManufacturer === "__new__"));
    }

    setSubmitting(operation);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <div className={wrapStyle}>
      {status === "applied" && state.status !== "approved" ? (
        <div className={wrapStyle}>
          <Select
            label="紐づける資材メーカー"
            labelSize="sm"
            disabled={pending}
            onValueChange={(value) => form.setFieldValue("selectedManufacturer", value)}
            options={[
              ...manufacturerNames.map((name) => ({ value: name, label: name })),
              { value: "__new__", label: "該当なし：メーカーを追加" },
            ]}
            placeholder="メーカーを選択してください"
            value={selectedManufacturer}
          />
          {selectedManufacturer === "__new__" ? (
            <Input
              label="新規メーカー名"
              labelSize="sm"
              disabled={pending}
              maxLength={300}
              onChange={(event) => form.setFieldValue("newManufacturerName", event.target.value)}
              value={newManufacturerName}
            />
          ) : null}
          <p className={adminInlineNoteStyle}>
            アカウントの確認後にログインを発行します。この操作では資材オーナー権限は付与されません。メーカーが提出する掲載・オーナー権限の申請と確認資料を審査してから、資材ごとに資材オーナー権限を付与してください。
          </p>
        </div>
      ) : null}
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {state.status === "done" ? <Notice tone="success">{state.message}</Notice> : null}

      {state.status === "approved" ? (
        <div className={credentialsStyle}>
          <p className={credentialLabelStyle}>
            Farmille企業会員IDとパスワード設定用の案内を発行しました。
          </p>
          <div className={css({ display: "grid", gap: "2" })}>
            <span className={adminInlineNoteStyle}>Farmille企業会員ID</span>
            <span className={adminCodeStyle}>{state.credentials.loginId}</span>
          </div>
          <div className={css({ display: "grid", gap: "2" })}>
            <span className={adminInlineNoteStyle}>パスワード設定用URL</span>
            <span className={adminCodeStyle}>{state.credentials.passwordSetupUrl}</span>
          </div>
          <p className={adminInlineNoteStyle}>
            {state.credentials.emailSent
              ? "Farmille企業会員IDとパスワード設定用URLを申請時の連絡先へ送信しました。メーカーはログイン後、掲載・オーナー権限の申請フォームから手続きできます。"
              : "承認は完了しましたが、案内メールを送信できませんでした。上記のFarmille企業会員IDとURLを申請時の連絡先へ送付してください。期限切れの場合はメーカーのパスワード再設定画面から再送できます。"}
          </p>
        </div>
      ) : null}

      {state.status === "invited" ? (
        <div className={credentialsStyle}>
          <p className={credentialLabelStyle}>招待コードを発行しました。</p>
          <span className={adminCodeStyle}>{state.inviteCode}</span>
        </div>
      ) : null}

      {state.status === "approved" ? null : (
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
              <ConfirmDialog
                action={(formData) => submit("reject", formData)}
                cancelLabel="やめる"
                confirmLabel="却下する"
                description="この申請を却下します。取り消せません。"
                title="この申請を却下しますか？"
                trigger={
                  <Button disabled={pending} size="sm" variant="danger">
                    却下
                  </Button>
                }
              >
                <Textarea
                  label="却下理由"
                  name="rejectedReason"
                  value={rejectedReason}
                  onChange={(event) => form.setFieldValue("rejectedReason", event.target.value)}
                  requirement="required"
                  placeholder="申請者へ伝える判断理由を入力"
                />
              </ConfirmDialog>
            </>
          ) : null}
          {status === "approved" ? (
            <ConfirmDialog
              cancelLabel="やめる"
              confirmLabel="凍結する"
              description="このアカウントを凍結します。メーカーはログインできなくなります。"
              onConfirm={() => submit("suspend")}
              title="このアカウントを凍結しますか？"
              trigger={
                <Button disabled={pending} size="sm" variant="danger">
                  凍結する
                </Button>
              }
            />
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
      )}
    </div>
  );
}
