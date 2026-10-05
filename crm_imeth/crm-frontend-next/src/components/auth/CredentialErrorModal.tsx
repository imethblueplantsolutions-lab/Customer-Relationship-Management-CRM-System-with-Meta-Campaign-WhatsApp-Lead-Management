"use client";

import { useEffect, useRef } from "react";

interface CredentialErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  message?: string;
}

export default function CredentialErrorModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Please try again...",
  message = "The email and password you entered did not match our records. Please double-check and try again.",
}: CredentialErrorModalProps) {
  const okButtonRef = useRef<HTMLButtonElement>(null);
  const openTimestampRef = useRef<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    openTimestampRef.current = Date.now();

    // Delay focusing the button to prevent the form submission 'Enter' key from immediately activating it
    const timer = setTimeout(() => {
      okButtonRef.current?.focus();
    }, 350);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore any keystrokes during the first 350ms to prevent enter-key bleed from form submit
      if (Date.now() - openTimestampRef.current < 350) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (onConfirm) {
          onConfirm();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    // Prevent accidental double clicks right as modal mounts
    if (Date.now() - openTimestampRef.current < 250) return;
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (Date.now() - openTimestampRef.current < 250) return;
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 transition-opacity duration-150 animate-in fade-in"
      // Intentionally no onClick={onClose} here: mimics native iOS alert dialog behavior
      // and prevents stray clicks or pointerup events from dismissing the modal instantly
    >
      <div
        className="w-full max-w-[280px] sm:max-w-[295px] rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-700/60 overflow-hidden text-center transition-all transform scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content Section */}
        <div className="px-5 pt-5 pb-4">
          <h3
            id="alert-dialog-title"
            className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight"
          >
            {title}
          </h3>
          <p
            id="alert-dialog-description"
            className="mt-1.5 text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed font-normal"
          >
            {message}
          </p>
        </div>

        {/* Action Buttons (iOS Alert Style) */}
        <div className="grid grid-cols-2 border-t border-slate-200/90 dark:border-slate-700">
          <button
            type="button"
            onClick={handleCancel}
            className="py-3 text-[15px] font-normal text-[#007AFF] dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100 dark:active:bg-slate-700 transition-colors border-r border-slate-200/90 dark:border-slate-700 cursor-pointer focus:outline-hidden"
          >
            Cancel
          </button>
          <button
            ref={okButtonRef}
            type="button"
            onClick={handleConfirm}
            className="py-3 text-[15px] font-semibold text-[#007AFF] dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100 dark:active:bg-slate-700 transition-colors cursor-pointer focus:outline-hidden"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
