"use client";

import Link from "next/link";

const quickActions = [
  { href: "/tasks", label: "משימה", icon: "+" },
  { href: "/finance", label: "פעולה", icon: "₪" },
  { href: "/documents", label: "מסמך", icon: "□" },
  { href: "/shopping", label: "קנייה", icon: "✓" },
];

export default function FloatingActionDock() {
  return (
    <details className="group fixed bottom-4 left-4 z-30 lg:bottom-6 lg:left-6">
      <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full bg-[#007aff] text-xl font-black text-white shadow-[0_12px_28px_rgba(0,122,255,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#006ee6]">
        +
        <span className="sr-only">פעולות מהירות</span>
      </summary>

      <div className="premium-details-panel absolute bottom-14 left-0 w-52 rounded-[20px] border border-[#e6e8ec] bg-white/95 p-2 text-right shadow-[0_18px_44px_rgba(15,23,42,0.1)] backdrop-blur-xl">
        <p className="px-3 py-2 text-xs font-bold text-slate-500">
          פעולה מהירה
        </p>
        <div className="grid gap-1.5">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center justify-between rounded-2xl bg-[#fafafb] px-3 py-2.5 text-sm font-bold text-[#1d1d1f] transition hover:bg-white"
            >
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#111827] text-white shadow-sm">
                {action.icon}
              </span>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}
