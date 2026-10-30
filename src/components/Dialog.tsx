"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ReactElement, ReactNode } from "react";

import { buttonRecipe, type ButtonVariants } from "./Button";
import { Icon } from "./Icon";
import { cx, sva } from "../../styled-system/css";

export const dialogRecipe = sva({
  slots: ["backdrop", "popup", "bar", "title", "description", "actions", "body", "foot", "close"],
  base: {
    backdrop: {
      position: "fixed",
      inset: "0",
      zIndex: "dialog",
      bg: "scrim/45",
      transitionProperty: "[opacity]",
      transitionDuration: "dialog",
      transitionTimingFunction: "out",
      _startingStyle: { opacity: "0" },
      _endingStyle: { opacity: "0" },
    },
    popup: {
      position: "fixed",
      zIndex: "dialog",
      color: "text.default",
      outline: "none",
      transitionDuration: "dialog",
      transitionTimingFunction: "out",
    },
    title: { m: "0", textStyle: "title" },
    description: { mt: "2", textStyle: "supporting", color: "text.muted" },
    actions: { display: "flex", gap: "2", mt: "4", "& > *": { flex: "1" } },
  },
  variants: {
    size: {
      panel: {
        popup: {
          inset: "0",
          m: "auto",
          h: "[fit-content]",
          w: "[calc(100% - {spacing.8})]",
          maxW: "dialog",
          maxH: "[calc(100dvh - {spacing.8})]",
          overflow: "auto",
          p: "4",
          bg: "surface.card",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "border.default",
          borderRadius: "card",
          boxShadow: "shadow.lift",
          transformOrigin: "center",
          transitionProperty: "[opacity, transform]",
          _startingStyle: {
            opacity: "0",
            transform: "scale(0.96)",
            _motionReduce: { transform: "none" },
          },
          _endingStyle: {
            opacity: "0",
            transform: "scale(0.96)",
            _motionReduce: { transform: "none" },
          },
        },
      },
      fullscreen: {
        popup: {
          inset: "0",
          h: "dvh",
          overflow: "auto",
          bg: "surface.page",
          transitionProperty: "[opacity]",
          _startingStyle: { opacity: "0" },
          _endingStyle: { opacity: "0" },
        },
        bar: {
          position: "sticky",
          top: "0",
          zIndex: "local.1",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2.5",
          py: "2.5",
          px: "4",
          bg: "surface.card",
          borderBottomWidth: "1px",
          borderBottomStyle: "solid",
          borderBottomColor: "border.default",
        },
        description: { px: "4" },
      },
      // 選ぶ・入れるためのポップアップ：画面の中央に浮かび、高さは中身で変えず、中だけをスクロールする
      sheet: {
        popup: {
          inset: "0",
          m: "auto",
          display: "flex",
          flexDirection: "column",
          w: "[calc(100% - {spacing.8})]",
          maxW: "guide",
          h: "[min(80dvh, 40rem)]",
          pt: "4",
          px: "4.5",
          bg: "surface.card",
          borderRadius: "card",
          boxShadow: "shadow.lift",
          transformOrigin: "center",
          transitionProperty: "[opacity, transform]",
          _startingStyle: {
            opacity: "0",
            transform: "translateY(14px) scale(0.97)",
            _motionReduce: { transform: "none" },
          },
          _endingStyle: {
            opacity: "0",
            transform: "translateY(14px) scale(0.97)",
            _motionReduce: { transform: "none" },
          },
        },
        bar: {
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2",
          mb: "2.5",
        },
        close: {
          display: "grid",
          placeItems: "center",
          w: "8",
          h: "8",
          border: "none",
          borderRadius: "pill",
          bg: "transparent",
          color: "text.muted",
          cursor: "pointer",
          _hover: { bg: "surface.panel", color: "text.default" },
        },
        body: { flex: "1", minH: "0", overflow: "auto", scrollbarGutter: "stable", pb: "4" },
        foot: {
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "3",
          py: "3",
          borderTopWidth: "1px",
          borderTopStyle: "solid",
          borderTopColor: "border.default",
        },
      },
    },
    /** sheet で、中身が横に長いもの（施用時期の線など）を PC で横に広げる。 */
    wide: {
      true: { popup: { pc: { maxW: "content.form" } } },
      false: {},
    },
    /** sheet で、中身の量に合わせて高さを決める（短い選択肢だけのとき）。 */
    fit: {
      true: { popup: { h: "[fit-content]", maxH: "[min(80dvh, 40rem)]" } },
      false: {},
    },
  },
  defaultVariants: { size: "panel", wide: false, fit: false },
});

type DialogOwnership =
  | { trigger: ReactElement; open?: undefined; onOpenChange?: undefined }
  | { trigger?: undefined; open: boolean; onOpenChange: (open: boolean) => void };

export type DialogProps = {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  size?: "panel" | "fullscreen" | "sheet";
  /** fullscreen の上部バーに置く閉じるボタンの文言。sheet では × の読み上げ名。 */
  closeLabel?: string;
  /** sheet の下に常に出しておく操作（完了など）。 */
  footer?: ReactNode;
  wide?: boolean;
  fit?: boolean;
} & DialogOwnership;

export function Dialog({
  title,
  description,
  children,
  size = "panel",
  closeLabel = "閉じる",
  footer,
  wide,
  fit,
  trigger,
  open,
  onOpenChange,
}: DialogProps) {
  const styles = dialogRecipe({ size, wide, fit });
  const titleNode = <BaseDialog.Title className={styles.title}>{title}</BaseDialog.Title>;

  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger === undefined ? null : <BaseDialog.Trigger render={trigger} />}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={styles.backdrop} />
        <BaseDialog.Popup className={styles.popup}>
          {size === "sheet" ? (
            <>
              <div className={styles.bar}>
                {titleNode}
                <BaseDialog.Close className={styles.close} aria-label={closeLabel}>
                  <Icon name="close" />
                </BaseDialog.Close>
              </div>
              {description === undefined ? null : (
                <BaseDialog.Description render={<div />} className={styles.description}>
                  {description}
                </BaseDialog.Description>
              )}
              <div className={styles.body}>{children}</div>
              {footer === undefined ? null : <div className={styles.foot}>{footer}</div>}
            </>
          ) : size === "fullscreen" ? (
            <div className={styles.bar}>
              {titleNode}
              <BaseDialog.Close className={buttonRecipe({ variant: "ghost", size: "sm" })}>
                {closeLabel}
              </BaseDialog.Close>
            </div>
          ) : (
            titleNode
          )}
          {size === "sheet" || description === undefined ? null : (
            <BaseDialog.Description render={<div />} className={styles.description}>
              {description}
            </BaseDialog.Description>
          )}
          {size === "sheet" ? null : children}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

export function DialogClose({
  children = "閉じる",
  variant = "ghost",
  className,
}: {
  children?: ReactNode;
  variant?: NonNullable<ButtonVariants>["variant"];
  className?: string;
}) {
  return (
    <BaseDialog.Close className={cx(buttonRecipe({ variant, size: "md" }), className)}>
      {children}
    </BaseDialog.Close>
  );
}

export function DialogActions({ children }: { children: ReactNode }) {
  return <div className={dialogRecipe().actions}>{children}</div>;
}
