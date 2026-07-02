"use client";

import { useState, type FormEvent } from "react";
import { demoAdminSession, authProviderNotes } from "@/data/auth";
import { storageKeys } from "@/lib/storageKeys";
import type { AuthSession } from "@/types/auth";
import { useFeedback } from "@/components/ui/FeedbackProvider";

function createEmailSession(email: string): AuthSession {
  const userName = email.split("@")[0] || "משתמש";

  return {
    id: crypto.randomUUID(),
    name: userName,
    email,
    provider: "email",
    role: "member",
    workspaceName: "משפחת כהן שור",
    signedInAt: new Date().toISOString(),
  };
}

function getStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(storageKeys.authSession);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    window.localStorage.removeItem(storageKeys.authSession);
    return null;
  }
}

export default function AuthManager() {
  const { toast } = useFeedback();
  const [session, setSession] = useState<AuthSession | null>(() =>
    getStoredSession()
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function persistSession(nextSession: AuthSession) {
    window.localStorage.setItem(
      storageKeys.authSession,
      JSON.stringify(nextSession)
    );
    setSession(nextSession);
  }

  function handleGoogleSignIn() {
    persistSession({
      ...demoAdminSession,
      signedInAt: new Date().toISOString(),
    });

    toast({
      title: "כניסה עם Google הופעלה",
      description:
        "בשלב הפקה נחבר כאן OAuth אמיתי של Google. האפליקציה לא מבקשת סיסמת Google.",
      tone: "success",
    });
  }

  function handleEmailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || password.length < 8) {
      toast({
        title: "פרטי התחברות לא מלאים",
        description: "יש להזין מייל וסיסמה באורך 8 תווים לפחות.",
        tone: "warning",
      });
      return;
    }

    persistSession(createEmailSession(cleanEmail));
    setPassword("");

    toast({
      title: "התחברת ל-Nestly",
      description: "הסיסמה לא נשמרה בדפדפן. זהו מצב פיתוח עד חיבור Auth אמיתי.",
      tone: "success",
    });
  }

  function handleSignOut() {
    window.localStorage.removeItem(storageKeys.authSession);
    setSession(null);
    toast({
      title: "יצאת מהחשבון",
      tone: "info",
    });
  }

  return (
    <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-[20px] border border-[#e6e8ec] bg-white p-4 text-right shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="rounded-2xl bg-[#f4e7c8] px-3 py-2 text-xs font-black text-[#111827]">
            אבטחה והרשאות
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">
              כניסה למשפחת כהן שור
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#1d1d1f]">
              התחברות מאובטחת ל-Nestly
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              כניסה עם Google מתבצעת דרך OAuth בלבד. Nestly לעולם לא אמורה
              לבקש מהמשתמש את סיסמת Google שלו בתוך טופס פנימי.
            </p>
          </div>
        </div>

        {session ? (
          <div className="rounded-[18px] border border-[#e6e8ec] bg-[#fafafb] p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-fit rounded-2xl border border-[#e6e8ec] bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-[#fafafb]"
              >
                יציאה
              </button>
              <div>
                <p className="text-xs font-bold text-slate-500">מחובר כרגע</p>
                <h3 className="mt-1 text-xl font-black text-[#1d1d1f]">
                  {session.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{session.email}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-3">
                <p className="text-[11px] font-bold text-slate-500">ספק</p>
                <p className="mt-1 font-black">
                  {session.provider === "google" ? "Google" : "מייל וסיסמה"}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <p className="text-[11px] font-bold text-slate-500">תפקיד</p>
                <p className="mt-1 font-black">
                  {session.role === "admin" ? "מנהל" : "בן משפחה"}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <p className="text-[11px] font-bold text-slate-500">מרחב</p>
                <p className="mt-1 font-black">{session.workspaceName}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="rounded-[18px] border border-[#e6e8ec] bg-[#111827] p-4 text-right text-white shadow-[0_12px_28px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5"
            >
              <span className="block text-sm font-bold text-white/70">
                מומלץ
              </span>
              <span className="mt-2 block text-xl font-black">
                כניסה עם Google
              </span>
              <span className="mt-2 block text-sm leading-6 text-white/70">
                OAuth מאובטח. אין הזנת סיסמת Google בתוך Nestly.
              </span>
            </button>

            <form
              onSubmit={handleEmailSignIn}
              className="rounded-[18px] border border-[#e6e8ec] bg-[#fafafb] p-4 text-right"
            >
              <p className="text-sm font-black text-[#1d1d1f]">
                כניסה עם מייל וסיסמה
              </p>
              <div className="mt-3 grid gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-2xl border border-[#e6e8ec] bg-white px-4 py-3 text-right outline-none focus:border-[#007aff]/50"
                  placeholder="כתובת מייל"
                  autoComplete="email"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="rounded-2xl border border-[#e6e8ec] bg-white px-4 py-3 text-right outline-none focus:border-[#007aff]/50"
                  placeholder="סיסמה לחשבון Nestly"
                  autoComplete="current-password"
                />
                <button
                  type="submit"
                  className="rounded-2xl bg-[#007aff] px-4 py-3 text-sm font-black text-white hover:bg-[#006ee6]"
                >
                  כניסה
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <aside className="rounded-[20px] border border-[#e6e8ec] bg-white p-4 text-right shadow-[0_8px_22px_rgba(15,23,42,0.045)]">
        <p className="text-xs font-bold text-slate-500">מודל אבטחה</p>
        <h3 className="mt-1 text-lg font-black text-[#1d1d1f]">
          מוכן לחיבור אמיתי
        </h3>
        <div className="mt-3 space-y-2">
          {authProviderNotes.map((item) => (
            <div key={item.title} className="rounded-2xl bg-[#fafafb] p-3">
              <p className="text-sm font-black text-[#1d1d1f]">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}

