"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLanguage } from "@/i18n/useLanguage";
import { Button } from "@/components/ui/Button";

type ToastTone = "success" | "info" | "warning" | "danger";

type ToastMessage = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
};

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type FeedbackContextValue = {
  toast: (message: Omit<ToastMessage, "id">) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const toastToneClasses: Record<ToastTone, string> = {
  success: "border-emerald-200 bg-emerald-50/95 text-emerald-800",
  info: "border-sky-200 bg-sky-50/95 text-sky-800",
  warning: "border-amber-200 bg-[#fff8eb]/95 text-[#7a5212]",
  danger: "border-rose-200 bg-rose-50/95 text-rose-800",
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { direction } = useLanguage();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null
  );
  const confirmQueueRef = useRef<PendingConfirm[]>([]);

  const closeToast = useCallback((id: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toastMessage) => toastMessage.id !== id)
    );
  }, []);

  const toast = useCallback(
    (message: Omit<ToastMessage, "id">) => {
      const id = crypto.randomUUID();

      setToasts((currentToasts) => [...currentToasts.slice(-3), { id, ...message }]);
      window.setTimeout(() => closeToast(id), 4200);
    },
    [closeToast]
  );

  const showNextConfirm = useCallback(() => {
    setPendingConfirm((currentConfirm) => {
      if (currentConfirm) {
        return currentConfirm;
      }

      return confirmQueueRef.current.shift() ?? null;
    });
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        confirmQueueRef.current.push({
          confirmLabel: "אישור",
          cancelLabel: "ביטול",
          tone: "default",
          ...options,
          resolve,
        });

        showNextConfirm();
      }),
    [showNextConfirm]
  );

  const resolveConfirm = useCallback(
    (value: boolean) => {
      setPendingConfirm((currentConfirm) => {
        currentConfirm?.resolve(value);
        return null;
      });

      window.setTimeout(showNextConfirm, 0);
    },
    [showNextConfirm]
  );

  useEffect(() => {
    if (!pendingConfirm) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        resolveConfirm(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingConfirm, resolveConfirm]);

  const contextValue = useMemo(
    () => ({
      toast,
      confirm,
    }),
    [confirm, toast]
  );

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}

      <div
        className={[
          "nestly-toast-stack pointer-events-none fixed z-[90] flex w-full max-w-sm flex-col gap-3 px-4",
          direction === "rtl" ? "left-4" : "right-4",
        ].join(" ")}
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toastMessage) => (
          <div
            key={toastMessage.id}
            className={[
              "pointer-events-auto rounded-[20px] border p-4 text-sm shadow-[0_18px_44px_rgba(33,43,63,0.16)] backdrop-blur-2xl animate-soft-in",
              toastToneClasses[toastMessage.tone],
              direction === "rtl" ? "text-right" : "text-left",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => closeToast(toastMessage.id)}
                className="rounded-full px-2 text-lg leading-none opacity-70 transition hover:opacity-100"
                aria-label="סגור הודעה"
              >
                ×
              </button>
              <div className="min-w-0 flex-1">
                <p className="font-black">{toastMessage.title}</p>
                {toastMessage.description && (
                  <p className="mt-1 leading-6 opacity-80">
                    {toastMessage.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {pendingConfirm && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/62 px-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              resolveConfirm(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            className={[
              "w-full max-w-md rounded-[24px] border border-[#e3d8c9] bg-white p-5 text-[#1d1d1f] shadow-[0_28px_90px_rgba(15,23,42,0.28)]",
              direction === "rtl" ? "text-right" : "text-left",
            ].join(" ")}
          >
            <p className="mb-2 text-xs font-bold text-[#7a5212]">Nestly</p>
            <h2 id="confirm-dialog-title" className="text-xl font-black text-[#111827]">
              {pendingConfirm.title}
            </h2>
            {pendingConfirm.description && (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {pendingConfirm.description}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                onClick={() => resolveConfirm(false)}
                tone="secondary"
              >
                {pendingConfirm.cancelLabel}
              </Button>
              <Button
                type="button"
                onClick={() => resolveConfirm(true)}
                tone={pendingConfirm.tone === "danger" ? "danger" : "primary"}
              >
                {pendingConfirm.confirmLabel}
              </Button>
            </div>
          </section>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }

  return context;
}
