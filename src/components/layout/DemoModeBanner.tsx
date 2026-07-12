"use client";

import { useEffect, useState } from "react";
import { exitDemoMode, isDemoModeActive } from "@/lib/demoMode";
import { getStorageScopeEventName } from "@/utils/storage";

export default function DemoModeBanner() {
  // מתחילים תמיד ב-false כדי שהרינדור בשרת ובלקוח יהיו זהים.
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

  if (!isDemoActive) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-0 z-[85] flex justify-center px-4 bottom-[calc(var(--nestly-bottom-nav-height,0px)+var(--nestly-safe-bottom-gap,0px)+0.75rem)] lg:bottom-6"
      role="status"
    >
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-[#eadfcd] bg-[#111827]/95 py-2 pr-4 pl-2 text-white shadow-[0_18px_50px_rgba(17,24,39,0.35)] backdrop-blur-xl">
        <span className="text-sm font-black">
          🎬 מצב דמו — משפחה לדוגמה, הנתונים שלכם שמורים בצד
        </span>
        <button
          type="button"
          onClick={exitDemoMode}
          className="min-h-9 rounded-full bg-white px-4 text-xs font-black text-[#111827] transition hover:bg-[#fff3d6]"
        >
          יציאה מהדמו
        </button>
      </div>
    </div>
  );
}
