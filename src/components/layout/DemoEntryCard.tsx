"use client";

import { useEffect, useState } from "react";
import { enterDemoMode, isDemoModeActive } from "@/lib/demoMode";
import { getStorageScopeEventName } from "@/utils/storage";

export default function DemoEntryCard() {
  const [isDemoActive, setIsDemoActive] = useState(false);

  useEffect(() => {
    function syncDemoState() {
      setIsDemoActive(isDemoModeActive());
    }

    syncDemoState();
    window.addEventListener(getStorageScopeEventName(), syncDemoState);

    return () =>
      window.removeEventListener(getStorageScopeEventName(), syncDemoState);
  }, []);

  // בתוך הדמו הבאנר הצף כבר מציע יציאה — אין צורך בכרטיס.
  if (isDemoActive) {
    return null;
  }

  return (
    <section className="rounded-[22px] border border-[#eadfcd]/80 bg-gradient-to-l from-[#fff8eb] to-white/90 p-4 text-right shadow-[0_12px_30px_rgba(33,43,63,0.055)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => {
            enterDemoMode();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="order-2 min-h-12 shrink-0 rounded-2xl bg-[#111827] px-6 text-sm font-black text-white shadow-[0_14px_30px_rgba(17,24,39,0.18)] transition hover:-translate-y-0.5 hover:bg-[#1f2937] sm:order-1"
        >
          🎬 צפו בדמו
        </button>
        <div className="order-1 min-w-0 sm:order-2">
          <p className="text-xs font-black text-[#9a6b17]">חדשים כאן?</p>
          <h2 className="mt-0.5 text-base font-black text-[#111827] sm:text-lg">
            סיור בנסטלי עם משפחה לדוגמה
          </h2>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 sm:text-sm">
            כל המודולים מלאים בנתונים בדויים של משפחת ישראלי — אפשר לשחק
            בחופשיות. הנתונים האמיתיים שלכם נשמרים בצד וחוזרים ביציאה מהדמו.
          </p>
        </div>
      </div>
    </section>
  );
}
