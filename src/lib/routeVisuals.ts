import type { AppIconName } from "@/components/ui/AppIcon";

// צבע ואייקון לפי מודול — משותף בין הסיידבר לתוצאות החיפוש, כדי שאותו
// מסך לא ייראה בשתי שפות עיצוב שונות. בלי זה כל פריטי ניווט נראים זהים.
export type RouteVisual = {
  icon: AppIconName;
  className: string;
};

const routeVisuals: Record<string, RouteVisual> = {
  "/": { icon: "home", className: "bg-slate-100 text-slate-700" },
  "/handle": { icon: "check", className: "bg-orange-50 text-orange-700" },
  "/memory": { icon: "search", className: "bg-cyan-50 text-cyan-700" },
  "/tasks": { icon: "check", className: "bg-amber-50 text-amber-700" },
  "/shopping": { icon: "shopping", className: "bg-sky-50 text-sky-700" },
  "/finance": { icon: "finance", className: "bg-emerald-50 text-emerald-700" },
  "/documents": { icon: "document", className: "bg-purple-50 text-purple-700" },
  "/health": { icon: "health", className: "bg-rose-50 text-rose-700" },
  "/vehicles": { icon: "car", className: "bg-blue-50 text-blue-700" },
  "/family": { icon: "family", className: "bg-violet-50 text-violet-700" },
  "/birthdays": { icon: "calendar", className: "bg-pink-50 text-pink-700" },
  "/knowledge": { icon: "knowledge", className: "bg-teal-50 text-teal-700" },
  "/timeline": { icon: "timeline", className: "bg-stone-100 text-stone-700" },
  "/life": { icon: "flag", className: "bg-indigo-50 text-indigo-700" },
  "/legacy": { icon: "book", className: "bg-yellow-50 text-yellow-800" },
  "/assistant": { icon: "chat", className: "bg-fuchsia-50 text-fuchsia-700" },
  "/security": { icon: "shield", className: "bg-slate-100 text-slate-700" },
  "/permissions": { icon: "lock", className: "bg-slate-100 text-slate-700" },
  "/settings": { icon: "settings", className: "bg-slate-100 text-slate-700" },
};

const fallbackVisual: RouteVisual = {
  icon: "search",
  className: "bg-slate-100 text-slate-500",
};

export function getRouteVisual(href: string): RouteVisual {
  return routeVisuals[href] ?? fallbackVisual;
}
