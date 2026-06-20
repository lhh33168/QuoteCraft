"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTone?: "danger" | "primary";
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "确认",
  cancelLabel = "取消",
  confirmTone = "primary",
  pending = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    return () => {
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!open || !mounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted, open]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      aria-modal="true"
      className="fixed inset-0 z-[999] flex min-h-screen items-center justify-center bg-[rgba(15,23,20,0.46)] px-4 py-6 backdrop-blur-[8px]"
      role="dialog"
    >
      <button
        aria-label="关闭确认弹窗"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onCancel}
        type="button"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%)]"
      />

      <div className="relative z-[1] w-full max-w-md rounded-[28px] border border-white/80 bg-[#fcfdfb] p-6 shadow-[0_28px_90px_rgba(19,33,29,0.24)] sm:p-7">
        <div className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
          请确认
        </div>
        <h3 className="mt-4 text-[1.4rem] font-semibold leading-[1.12] text-ink">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-muted">{description}</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-[18px] border border-black/8 bg-white px-4 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:bg-black/[0.03] disabled:text-muted"
            disabled={pending}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={[
              "inline-flex min-h-11 items-center justify-center rounded-[18px] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70",
              confirmTone === "danger"
                ? "bg-[#c84d4d] shadow-[0_10px_22px_rgba(200,77,77,0.22)]"
                : "bg-pine shadow-[0_10px_22px_rgba(24,77,63,0.16)]"
            ].join(" ")}
            disabled={pending}
            onClick={onConfirm}
            type="button"
          >
            {pending ? "处理中..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
