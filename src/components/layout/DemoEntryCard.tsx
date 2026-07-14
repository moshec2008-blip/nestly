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
    <section className="rounded-[18px] border border-[#eadfcd]/65 bg-gradient-to-l from-[#fff8eb] to-white/90 p-3 text-right shadow-[0_6px_18px_rgba(33,43,63,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            enterDemoMode();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="min-h-10 shrink-0 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-4 text-xs font-black text-[#111827] shadow-[0_8px_18px_rgba(33,43,63,0.06)] transition duration-200 hover:-translate-y-0.5 hover:bg-white active:scale-[0.99]"
        >
          צפו בדמו
        </button>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-black text-[#111827]">
            רוצים לראות הכול עובד?
          </h2>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
            סיור קצר עם משפחה לדוגמה
          </p>
        </div>
      </div>
    </section>
  );
}
