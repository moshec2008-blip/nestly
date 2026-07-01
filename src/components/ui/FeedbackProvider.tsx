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
  success: "border-emerald-300/25 bg-emerald-400/12 text-emerald-100",
  info: "border-sky-300/25 bg-sky-400/12 text-sky-100",
  warning: "border-[#d8b470]/35 bg-[#d8b470]/12 text-[#f4e7c8]",
  danger: "border-red-300/25 bg-red-400/12 text-red-100",
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
          "pointer-events-none fixed top-24 z-[90] flex w-full max-w-sm flex-col gap-3 px-4",
          direction === "rtl" ? "left-4" : "right-4",
        ].join(" ")}
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toastMessage) => (
          <div
            key={toastMessage.id}
            className={[
              "pointer-events-auto rounded-[24px] border p-4 text-sm shadow-[0_24px_72px_rgba(0,0,0,0.38)] backdrop-blur-2xl animate-soft-in",
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
              "w-full max-w-md rounded-[32px] border border-[rgba(216,180,112,0.18)] bg-[#080c18]/95 p-6 text-[#fff9ea] shadow-[0_36px_110px_rgba(0,0,0,0.58)] backdrop-blur-2xl",
              direction === "rtl" ? "text-right" : "text-left",
            ].join(" ")}
          >
            <p className="mb-2 text-xs font-bold text-[#d8b470]">
              Nestly
            </p>
            <h2 id="confirm-dialog-title" className="text-2xl font-black">
              {pendingConfirm.title}
            </h2>
            {pendingConfirm.description && (
              <p className="mt-3 text-sm leading-7 text-[#a9a295]">
                {pendingConfirm.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => resolveConfirm(false)}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-[#d7cfbf] transition hover:bg-white/[0.1]"
              >
                {pendingConfirm.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => resolveConfirm(true)}
                className={[
                  "rounded-2xl px-5 py-3 text-sm font-black transition",
                  pendingConfirm.tone === "danger"
                    ? "bg-red-500 text-white hover:bg-red-400"
                    : "bg-[#f4e7c8] text-[#080b16] hover:bg-[#fff3d6]",
                ].join(" ")}
              >
                {pendingConfirm.confirmLabel}
              </button>
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
