"use client";

import { signIn, useSession } from "next-auth/react";
import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthPromptOptions = {
  reason?: string;
};

type AuthPromptContextValue = {
  requireAuth: (options?: AuthPromptOptions) => boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
};

const AuthPromptContext = createContext<AuthPromptContextValue | null>(null);

type AuthPromptProviderProps = {
  children: ReactNode;
};

type PendingPrompt = {
  reason: string;
};

type AuthSetupStatus = {
  googleConfigured: boolean;
  readyForProduction: boolean;
  missing?: {
    googleClientId: boolean;
    googleClientSecret: boolean;
    authSecret: boolean;
    authUrl: boolean;
  };
};

export function useAuthPrompt() {
  const context = useContext(AuthPromptContext);

  if (!context) {
    throw new Error("useAuthPrompt must be used inside AuthPromptProvider");
  }

  return context;
}

export default function AuthPromptProvider({ children }: AuthPromptProviderProps) {
  const { status } = useSession();
  const [pendingPrompt, setPendingPrompt] = useState<PendingPrompt | null>(null);
  const [setupStatus, setSetupStatus] = useState<AuthSetupStatus | null>(null);
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    let isActive = true;

    fetch("/api/auth/setup-status")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: AuthSetupStatus | null) => {
        if (isActive) {
          setSetupStatus(payload);
        }
      })
      .catch(() => {
        if (isActive) {
          setSetupStatus({
            googleConfigured: false,
            readyForProduction: false,
          });
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const value = useMemo<AuthPromptContextValue>(
    () => ({
      isAuthenticated,
      isGuest: !isAuthenticated,
      requireAuth: (options) => {
        if (isAuthenticated) {
          return true;
        }

        setPendingPrompt({
          reason:
            options?.reason ||
            "כדי לשמור ולסנכרן מידע משפחתי רגיש, יש להתחבר לחשבון מאובטח.",
        });

        return false;
      },
    }),
    [isAuthenticated]
  );

  return (
    <AuthPromptContext.Provider value={value}>
      {children}

      {pendingPrompt && (
        <div
          className="fixed inset-0 z-[92] flex items-end justify-center bg-slate-950/38 px-3 pb-3 backdrop-blur-[2px] sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-prompt-title"
        >
          <div className="w-full max-w-md rounded-[28px] bg-white p-4 text-right text-[#111827] shadow-[0_28px_90px_rgba(15,23,42,0.24)] ring-1 ring-[#eadfcd]">
            <p className="text-xs font-black text-[#8a5b16]">
              שמירה וסנכרון
            </p>
            <h2 id="auth-prompt-title" className="mt-1 text-xl font-black">
              התחברות מאובטחת
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {pendingPrompt.reason}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              אפשר להמשיך במצב בסיסי, אבל המידע יישמר במכשיר הזה בלבד.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                disabled={setupStatus?.googleConfigured === false}
                className="min-h-11 rounded-2xl bg-[#111827] px-4 text-sm font-black text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              >
                {setupStatus?.googleConfigured === false
                  ? "Google עדיין לא מוגדר"
                  : "התחבר עם Google"}
              </button>
              <button
                type="button"
                onClick={() => setPendingPrompt(null)}
                className="min-h-11 rounded-2xl border border-[#eadfcd] bg-[#fffdf8] px-4 text-sm font-black text-slate-700 transition hover:bg-white"
              >
                המשך במצב בסיסי
              </button>
            </div>
            {setupStatus?.googleConfigured === false && (
              <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800 ring-1 ring-amber-100">
                התחברות Google מושבתת עד שיוגדרו משתני הסביבה של Google ו־NextAuth.
                אפשר להמשיך במצב בסיסי, והמידע יישמר במכשיר הזה בלבד.
              </p>
            )}
          </div>
        </div>
      )}
    </AuthPromptContext.Provider>
  );
}
