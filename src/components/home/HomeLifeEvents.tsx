"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import { getActiveLifeEvents } from "@/services/lifeEventsService";
import type { LifeEvent } from "@/types/lifeEvents";

export default function HomeLifeEvents() {
  const [events, setEvents] = useState<LifeEvent[]>([]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setEvents(getActiveLifeEvents().slice(0, 2));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (events.length === 0) {
    return null;
  }

  const primaryEvent = events[0];

  return (
    <section className="w-full max-w-full overflow-hidden rounded-[24px] bg-gradient-to-br from-[#fff8eb] via-white to-[#f4f8fb] p-3 shadow-[0_10px_26px_rgba(33,43,63,0.045)]" dir="rtl">
      <Link href="/life" className="flex items-center gap-3 text-right">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-[#8a5b16] shadow-sm">
          <AppIcon name="timeline" className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-black text-[#8a5b16]">
            סיפור פעיל
          </span>
          <span className="block truncate text-base font-black text-[#111827]">
            {primaryEvent.title}
          </span>
          <span className="mt-0.5 block truncate text-xs font-semibold text-slate-600">
            {primaryEvent.subtitle}
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
          {primaryEvent.progress}%
        </span>
      </Link>
    </section>
  );
}
