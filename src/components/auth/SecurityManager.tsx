"use client";

import { useEffect, useState } from "react";
import {
  getActiveFamilySpace,
  getFamilySpaceEventName,
  type FamilySpace,
} from "@/lib/familySpace";

export default function SecurityManager() {
  const [familySpace, setFamilySpace] = useState<FamilySpace | null>(null);

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
          Nestly פועלת כרגע במצב בסיסי: כל המידע נשמר במכשיר הזה בלבד.
          התחברות עם חשבון, סנכרון ושיתוף משפחתי יתווספו בהמשך.
        </p>

        <div className="mt-4 rounded-[20px] bg-[#fafafb] p-3">
          <div className="flex items-center justify-end gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff8eb] text-lg font-black text-[#7a5212] ring-1 ring-[#eadfcd]">
              N
            </span>
            <div>
              <p className="text-xs font-black text-slate-500">מצב בסיסי</p>
              <h2 className="mt-1 text-lg font-black text-[#111827]">
                אורח במכשיר זה
              </h2>
              <p className="text-sm font-semibold text-slate-600">
                המידע נשמר במכשיר זה בלבד
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#fffdf8] p-3 ring-1 ring-[#eadfcd]">
            <p className="text-[11px] font-black text-slate-500">שיטת כניסה</p>
            <p className="mt-1 text-sm font-black text-[#111827]">מצב בסיסי</p>
          </div>
          <div className="rounded-2xl bg-[#fffdf8] p-3 ring-1 ring-[#eadfcd]">
            <p className="text-[11px] font-black text-slate-500">שמירה מקומית</p>
            <p className="mt-1 text-sm font-black text-[#111827]">
              במכשיר זה בלבד
            </p>
          </div>
          <div className="rounded-2xl bg-[#fffdf8] p-3 ring-1 ring-[#eadfcd]">
            <p className="text-[11px] font-black text-slate-500">מרחב</p>
            <p className="mt-1 text-sm font-black text-[#111827]">
              {familySpace?.name || "המרחב המשפחתי שלי"}
            </p>
          </div>
        </div>
      </div>

      <aside className="rounded-[24px] bg-gradient-to-br from-[#fff8eb] to-white p-4 text-right shadow-[0_16px_40px_rgba(33,43,63,0.08)] ring-1 ring-[#eadfcd]">
        <p className="text-xs font-black text-slate-500">מה מוגן?</p>
        <h2 className="mt-1 text-lg font-black text-[#111827]">
          מידע משפחתי פרטי
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          במצב בסיסי המידע נשמר בדפדפן המקומי בלבד ואינו נשלח לשום שרת.
        </p>
        <div className="mt-4 rounded-2xl bg-white/78 p-3 text-xs font-bold leading-5 text-slate-600 ring-1 ring-white">
          בהמשך ניתן יהיה לחבר התחברות עם חשבון, סנכרון בין מכשירים, הזמנות
          לבני משפחה, הרשאות לפי תפקידים והצפנת מסמכים.
        </div>
      </aside>
    </section>
  );
}
