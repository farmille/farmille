"use client";

import { startTransition, useActionState, useState } from "react";

import {
  adminActionsStyle,
  adminCodeStyle,
  adminInlineNoteStyle,
} from "@/app/admin/_components/admin-ui";
import { initialSellerActionState } from "@/app/admin/_lib/action-state";
import { sellerOperationAction } from "@/app/admin/sellers/[id]/actions";
import { Button, Textarea } from "@/components";
import { FormMessage } from "@/components/auth/fields";
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
const CONFIRM_MESSAGES: Record<"reject" | "suspend", { note: string; label: string }> = {
  reject: { note: "この申請を却下します。取り消せません。", label: "却下する" },
  suspend: {
    note: "このアカウントを凍結します。出品者はログインできなくなります。",
    label: "凍結する",
  },
};

export function SellerReviewActions({
  sellerId,
  status,
  inviteCode,
}: {
  sellerId: string;
  status: string;
  inviteCode: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    sellerOperationAction,
    initialSellerActionState,
  );
  const [confirming, setConfirming] = useState<"reject" | "suspend" | null>(null);
  const [rejectedReason, setRejectedReason] = useState("");

  const submit = (operation: Operation): void => {
    const formData = new FormData();
    formData.set("sellerId", sellerId);
    formData.set("operation", operation);
    if (operation === "reject") {
      formData.set("rejectedReason", rejectedReason);
    }
    setConfirming(null);
    startTransition(() => {
      formAction(formData);
    });
  };

  const confirmation = confirming === null ? null : CONFIRM_MESSAGES[confirming];

  return (
    <div className={wrapStyle}>
      {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
      {state.status === "done" ? <FormMessage tone="info">{state.message}</FormMessage> : null}

      {state.status === "approved" ? (
        <div className={credentialsStyle}>
          <p className={credentialLabelStyle}>
            共有ログインを発行しました。パスワードはこの画面にしか表示されません。
          </p>
          <div>
            <span className={adminInlineNoteStyle}>ログインID</span>
            <br />
            <span className={adminCodeStyle}>{state.credentials.loginId}</span>
          </div>
          <div>
            <span className={adminInlineNoteStyle}>初期パスワード</span>
            <br />
            <span className={adminCodeStyle}>{state.credentials.password}</span>
          </div>
          <p className={adminInlineNoteStyle}>
            申請者へ安全な手段で伝え、初回ログイン後にパスワードを変更してもらってください。
          </p>
        </div>
      ) : null}

      {state.status === "invited" ? (
        <div className={credentialsStyle}>
          <p className={credentialLabelStyle}>招待コードを発行しました。</p>
          <span className={adminCodeStyle}>{state.inviteCode}</span>
        </div>
      ) : null}

      {confirmation === null ? (
        <div className={adminActionsStyle}>
          {status === "applied" ? (
            <>
              <Button disabled={pending} onClick={() => submit("approve")} size="sm">
                承認して共有ログインを発行
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
