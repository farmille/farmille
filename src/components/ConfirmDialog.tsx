"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useRef, useState, useTransition, type ReactElement, type ReactNode } from "react";

import { Button, buttonRecipe } from "./Button";
import { dialogRecipe } from "./Dialog";
import { Form } from "./form/Form";
import { css, cva, cx } from "../../styled-system/css";

// 3つ横に並べると 375px 幅のパネルに収まらないので、別の選択肢があるときは縦に積む
const actionsLayoutRecipe = cva({
  base: {},
  variants: { layout: { row: {}, stack: { flexDirection: "column" } } },
});

const fieldsStyle = css({ mt: "4" });

const closeButtonStyle = buttonRecipe({ variant: "ghost", size: "md" });

type ConfirmDialogOwnership =
  | { trigger: ReactElement; open?: undefined; onOpenChange?: undefined; pending?: undefined }
  | {
      trigger?: undefined;
      open: boolean;
      onOpenChange: (open: boolean) => void;
      /** 呼び出し側が進めている処理の最中。ボタンを押せなくし、確認ボタンの文言を pendingLabel にする。 */
      pending?: boolean;
    };

type ConfirmDialogConfirmation =
  | {
      /** 確認ボタンで送るフォームの action。children の入力を検証してから一緒に送る。 */
      action: (formData: FormData) => void | Promise<void>;
      onConfirm?: undefined;
      /** フォームに含める入力（理由の Textarea や hidden input）。 */
      children?: ReactNode;
    }
  | { action?: undefined; onConfirm: () => void | Promise<void>; children?: undefined };

export type ConfirmDialogProps = {
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  /** 処理中の確認ボタンの文言。省くと confirmLabel のまま押せなくなる。 */
  pendingLabel?: string;
  cancelLabel?: string;
  /** 確認ボタンの色。最初のフォーカスは danger ならキャンセル、primary なら確認ボタンに置く。 */
  tone?: "danger" | "primary";
  /** 3つ目の選択肢（例：保存せずに閉じる）。選ぶと onSelect を呼んで閉じる。 */
  alternative?: { label: string; onSelect: () => void };
} & ConfirmDialogOwnership &
  ConfirmDialogConfirmation;

/**
 * 削除などの操作の前に確かめるダイアログ（role=alertdialog）。trigger を渡すか、open と onOpenChange で開閉を持つ。
 * action を渡すと本文がフォームになり、children の入力を検証してから送る。
 * 確定の処理中は開いたままボタンを押せなくし、終わったら閉じる（action は trigger で開いたときだけ閉じる）。
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const {
    title,
    description,
    confirmLabel,
    pendingLabel = confirmLabel,
    cancelLabel = "キャンセル",
    tone = "danger",
    alternative,
  } = props;
  const [ownOpen, setOwnOpen] = useState(false);
  const [confirming, startConfirming] = useTransition();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const styles = dialogRecipe({ size: "panel" });
  const open = props.trigger === undefined ? props.open : ownOpen;
  const setOpen = props.trigger === undefined ? props.onOpenChange : setOwnOpen;
  const busy = confirming || props.pending === true;

  // 失敗は transition から一番近いエラー境界へ届く（Next の redirect もそこで処理される）
  function confirm(work: () => void | Promise<void>, closeWhenDone: boolean): void {
    startConfirming(async () => {
      await work();
      if (closeWhenDone) setOpen(false);
    });
  }

  const actions = (
    <div
      className={cx(
        styles.actions,
        actionsLayoutRecipe({ layout: alternative === undefined ? "row" : "stack" }),
      )}
    >
      {alternative === undefined ? null : (
        <AlertDialog.Close
          className={closeButtonStyle}
          disabled={busy}
          onClick={alternative.onSelect}
        >
          {alternative.label}
        </AlertDialog.Close>
      )}
      <AlertDialog.Close className={closeButtonStyle} disabled={busy} ref={cancelRef}>
        {cancelLabel}
      </AlertDialog.Close>
      {/* SubmitButton は ref を受けないので、primary で最初にフォーカスを置くため Button で送信中の表示を持つ */}
      <Button
        disabled={busy}
        focusableWhenDisabled={busy}
        onClick={props.action === undefined ? () => confirm(props.onConfirm, true) : undefined}
        ref={confirmRef}
        type={props.action === undefined ? "button" : "submit"}
        variant={tone}
      >
        {busy ? pendingLabel : confirmLabel}
      </Button>
    </div>
  );

  return (
    <AlertDialog.Root
      // 処理中は Escape でも閉じない
      onOpenChange={(next) => {
        if (next || !busy) setOpen(next);
      }}
      open={open}
    >
      {props.trigger === undefined ? null : <AlertDialog.Trigger render={props.trigger} />}
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className={styles.backdrop} />
        <AlertDialog.Popup
          className={styles.popup}
          initialFocus={tone === "danger" ? cancelRef : confirmRef}
        >
          <AlertDialog.Title className={styles.title}>{title}</AlertDialog.Title>
          {description === undefined ? null : (
            <AlertDialog.Description className={styles.description} render={<div />}>
              {description}
            </AlertDialog.Description>
          )}
          {props.action === undefined ? (
            actions
          ) : (
            <Form
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                confirm(() => props.action(formData), props.trigger !== undefined);
              }}
            >
              {props.children === undefined ? null : (
                <div className={fieldsStyle}>{props.children}</div>
              )}
              {actions}
            </Form>
          )}
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
