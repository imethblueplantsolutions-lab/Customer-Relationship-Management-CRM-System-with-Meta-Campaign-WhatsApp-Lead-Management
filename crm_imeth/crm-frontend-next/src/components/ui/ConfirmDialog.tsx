"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, AlertCircle, Info, Loader2, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus confirm button when opened
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: AlertCircle,
      iconBg: "bg-red-100 text-red-600 ring-red-50",
      buttonBg: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    },
    warning: {
      icon: AlertTriangle,
      iconBg: "bg-amber-100 text-amber-600 ring-amber-50",
      buttonBg: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500",
    },
    info: {
      icon: Info,
      iconBg: "bg-blue-100 text-blue-600 ring-blue-50",
      buttonBg: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    },
  }[variant];

  const IconComponent = variantStyles.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 transform transition-all animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-8 ${variantStyles.iconBg}`}
          >
            <IconComponent className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h3
              id="confirm-dialog-title"
              className="text-base font-bold text-slate-900 tracking-tight"
            >
              {title}
            </h3>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-xl px-4 py-2.5 text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 ${variantStyles.buttonBg}`}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
