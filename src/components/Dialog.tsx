"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ReactElement, ReactNode } from "react";

import { buttonRecipe, type ButtonVariants } from "./Button";
import { cx, sva } from "../../styled-system/css";

export const dialogRecipe = sva({
  slots: ["backdrop", "popup", "bar", "title", "description", "actions"],
  base: {
    backdrop: {
      position: "fixed",
      inset: "0",
      zIndex: "dialog",
      bg: "scrim/45",
      transitionProperty: "opacity",
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
    title: { m: "0" },
    description: { mt: "2", fontSize: "sm", color: "text.muted", lineHeight: "relaxed" },
    actions: { display: "flex", gap: "2", mt: "4", "& > *": { flex: "1" } },
  },
  variants: {
    size: {
      panel: {
        popup: {
          inset: "0",
          m: "auto",
          h: "fit-content",
          w: "calc(100% - {spacing.8})",
          maxW: "dialog",
          maxH: "calc(100dvh - {spacing.8})",
          overflow: "auto",
          p: "4",
          bg: "surface.card",
          borderWidth: "1px",
          borderStyle: "solid",
          borderColor: "border.default",
          borderRadius: "card",
          boxShadow: "shadow.lift",
          transformOrigin: "center",
          transitionProperty: "opacity, transform",
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
        title: { fontSize: "lg" },
      },
      fullscreen: {
        popup: {
          inset: "0",
          h: "100dvh",
          overflow: "auto",
          bg: "surface.page",
          transitionProperty: "opacity",
          _startingStyle: { opacity: "0" },
          _endingStyle: { opacity: "0" },
        },
        bar: {
          position: "sticky",
          top: "0",
          zIndex: "1",
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
        title: { fontSize: "sm" },
        description: { px: "4" },
      },
    },
  },
  defaultVariants: { size: "panel" },
});

type DialogOwnership =
  | { trigger: ReactElement; open?: undefined; onOpenChange?: undefined }
  | { trigger?: undefined; open: boolean; onOpenChange: (open: boolean) => void };

export type DialogProps = {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  size?: "panel" | "fullscreen";
  /** fullscreen の上部バーに置く閉じるボタンの文言。 */
  closeLabel?: string;
} & DialogOwnership;

export function Dialog({
  title,
  description,
  children,
  size = "panel",
  closeLabel = "閉じる",
  trigger,
  open,
  onOpenChange,
}: DialogProps) {
  const styles = dialogRecipe({ size });
  const titleNode = <BaseDialog.Title className={styles.title}>{title}</BaseDialog.Title>;
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger === undefined ? null : <BaseDialog.Trigger render={trigger} />}
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={styles.backdrop} />
        <BaseDialog.Popup className={styles.popup}>
          {size === "fullscreen" ? (
            <div className={styles.bar}>
              {titleNode}
              <BaseDialog.Close className={buttonRecipe({ variant: "ghost", size: "sm" })}>
                {closeLabel}
              </BaseDialog.Close>
            </div>
          ) : (
            titleNode
          )}
          {description === undefined ? null : (
            <BaseDialog.Description render={<div />} className={styles.description}>
              {description}
            </BaseDialog.Description>
          )}
          {children}
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
