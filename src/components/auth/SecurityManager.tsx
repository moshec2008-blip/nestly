"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  getActiveFamilySpace,
  getFamilySpaceEventName,
  type FamilySpace,
} from "@/lib/familySpace";

export default function SecurityManager() {
  const { data: session, status } = useSession();
  const [familySpace, setFamilySpace] = useState<FamilySpace | null>(null);
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    function syncFamilySpace() {
      setFamilySpace(getActiveFamilySpace());
    }

    syncFamilySpace();
    window.addEventListener(getFamilySpaceEventName(), syncFamilySpace);

    return () =>
      window.removeEventListener(getFamilySpaceEventName(), syncFamilySpace);
  }, []);

  return (
    <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-[24px] bg-white/92 p-4 text-right shadow-[0_16px_40px_rgba(33,43,63,0.08)] ring-1 ring-[#eadfcd]">
        <p className="text-xs font-black text-[#007aff]">אבטחה</p>
        <h1 className="mt-1 text-2xl font-black text-[#111827]">
          מרחב משפחתי מאובטח
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
          Nestly מפרידה בין מצב דמו, מצב בסיסי מקומי ומצב מחובר. במצב מחובר
          נוצר מרחב משפחתי פרטי שמוכן לסנכרון ענני ולשיתוף משפחתי בהמשך.
        </p>

        <div className="mt-4 rounded-[20px] bg-[#fafafb] p-3">
          <div className="flex items-center justify-end gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff8eb] text-lg font-black text-[#7a5212] ring-1 ring-[#eadfcd]">
              {isAuthenticated
                ? (session?.user?.name || session?.user?.email || "N")
                    .slice(0, 1)
                    .toUpperCase()
                : "N"}
            </span>
            <div>
              <p className="text-xs font-black text-slate-500">
                {isAuthenticated ? "מצב מחובר" : "מצב בסיסי"}
              </p>
              <h2 className="mt-1 text-lg font-black text-[#111827]">
                {isAuthenticated
                  ? session?.user?.name || "חשבון Google"
                  : "אורח במכשיר זה"}
              </h2>
              <p className="text-sm font-semibold text-slate-600">
                {isAuthenticated
                  ? session?.user?.email || "מחובר באמצעות Google"
                  : "המידע נשמר במכשיר זה בלבד"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#fffdf8] p-3 ring-1 ring-[#eadfcd]">
            <p className="text-[11px] font-black text-slate-500">שיטת כניסה</p>
            <p className="mt-1 text-sm font-black text-[#111827]">
              {isAuthenticated ? "Google" : "מצב בסיסי"}
            </p>
          </div>
          <div className="rounded-2xl bg-[#fffdf8] p-3 ring-1 ring-[#eadfcd]">
            <p className="text-[11px] font-black text-slate-500">שמירה</p>
            <p className="mt-1 text-sm font-black text-[#111827]">
              {isAuthenticated ? "מוכן לענן" : "במכשיר זה בלבד"}
            </p>
          </div>
          <div className="rounded-2xl bg-[#fffdf8] p-3 ring-1 ring-[#eadfcd]">
            <p className="text-[11px] font-black text-slate-500">מרחב</p>
            <p className="mt-1 text-sm font-black text-[#111827]">
              {familySpace?.name || "המרחב המשפחתי שלי"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="min-h-11 rounded-2xl border border-rose-200 bg-rose-50 px-5 text-sm font-black text-rose-700 transition hover:bg-rose-100"
            >
              התנתקות
            </button>
          ) : (
            <Link
              href="/login?callbackUrl=/security"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#111827] px-5 text-sm font-black text-white transition hover:bg-[#1f2937]"
            >
              התחברות עם Google
            </Link>
          )}
        </div>
      </div>

      <aside className="rounded-[24px] bg-gradient-to-br from-[#fff8eb] to-white p-4 text-right shadow-[0_16px_40px_rgba(33,43,63,0.08)] ring-1 ring-[#eadfcd]">
        <p className="text-xs font-black text-slate-500">מה מוגן?</p>
        <h2 className="mt-1 text-lg font-black text-[#111827]">
          מידע משפחתי פרטי
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          במצב בסיסי המידע נשאר בדפדפן המקומי. במצב מחובר Nestly מכינה מרחב
          משפחתי מבודד לפי חשבון, עם תשתית לתפקידים, הרשאות וסנכרון.
        </p>
        <div className="mt-4 rounded-2xl bg-white/78 p-3 text-xs font-bold leading-5 text-slate-600 ring-1 ring-white">
          אחסון ענני מלא למסמכים, הזמנות בני משפחה והרשאות נאכפות בצד שרת
          עדיין דורשים חיבור בסיס נתונים וספק אחסון.
        </div>
      </aside>
    </section>
  );
}
