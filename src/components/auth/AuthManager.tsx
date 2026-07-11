"use client";

import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { brand } from "@/lib/branding";

function getLoginErrorMessage(error: string | null) {
  if (!error) {
    return null;
  }

  return "לא הצלחנו להשלים את ההתחברות. נסה שוב בעוד רגע.";
}

export default function AuthManager() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const errorMessage = getLoginErrorMessage(searchParams.get("error"));
  const isLoading = status === "loading";
  const isSignedIn = status === "authenticated";

  return (
    <section className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col justify-center px-4 py-6 text-right">
      <div className="rounded-[28px] bg-white/94 p-5 shadow-[0_24px_70px_rgba(17,24,39,0.12)] ring-1 ring-[#eadfcd]">
        <div className="flex items-center justify-end gap-3">
          <div>
            <p className="text-xs font-black text-[#9a6b17]">כניסה מאובטחת</p>
            <h1 className="mt-1 text-2xl font-black text-[#111827]">
              {brand.productName}
            </h1>
          </div>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff8eb] p-2 shadow-sm ring-1 ring-[#eadfcd]">
            <Image
              src="/nestly-logo.png"
              alt="Nestly"
              width={48}
              height={48}
              className="h-full w-full object-contain"
              priority
            />
          </span>
        </div>

        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
          המידע המשפחתי שלך פרטי: כספים, בריאות, מסמכים, משימות ואירועים
          נפתחים רק אחרי התחברות עם חשבון Google.
        </p>

        {errorMessage && (
          <div className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100">
            {errorMessage}
          </div>
        )}

        {isSignedIn ? (
          <div className="mt-4 rounded-2xl bg-[#fafafb] p-3">
            <p className="text-xs font-black text-slate-500">מחובר כרגע</p>
            <p className="mt-1 text-base font-black text-[#111827]">
              {session.user?.name || "משתמש Nestly"}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-600">
              {session.user?.email}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href="/"
                className="flex min-h-11 items-center justify-center rounded-2xl bg-[#111827] px-4 text-sm font-black text-white"
              >
                כניסה לאפליקציה
              </a>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-white px-4 text-sm font-black text-slate-700"
              >
                התנתקות
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/" })}
            disabled={isLoading}
            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#111827] px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(17,24,39,0.18)] transition hover:bg-[#1f2937] disabled:cursor-wait disabled:opacity-70"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm font-black text-[#111827]">
              G
            </span>
            {isLoading ? "בודק התחברות..." : "התחברות עם Google"}
          </button>
        )}

        <div className="mt-4 rounded-2xl bg-[#fffdf8] p-3 text-xs font-semibold leading-5 text-slate-600 ring-1 ring-[#eadfcd]">
          Nestly לא מבקש את סיסמת Google שלך בתוך האפליקציה. ההתחברות מתבצעת
          דרך Google בלבד.
        </div>
      </div>
    </section>
  );
}
