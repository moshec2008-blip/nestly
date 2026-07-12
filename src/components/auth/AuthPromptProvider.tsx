"use client";

import { createContext, useContext, type ReactNode } from "react";

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

export function useAuthPrompt() {
  const context = useContext(AuthPromptContext);

  if (!context) {
    throw new Error("useAuthPrompt must be used inside AuthPromptProvider");
  }

  return context;
}

// התחברות עם Google מנוטרלת בינתיים — כל הפעולות מותרות במצב מקומי,
// ולכן requireAuth תמיד מאשר בלי להציג חלון התחברות.
const localModeValue: AuthPromptContextValue = {
  isAuthenticated: false,
  isGuest: true,
  requireAuth: () => true,
};

export default function AuthPromptProvider({ children }: AuthPromptProviderProps) {
  return (
    <AuthPromptContext.Provider value={localModeValue}>
      {children}
    </AuthPromptContext.Provider>
  );
}
