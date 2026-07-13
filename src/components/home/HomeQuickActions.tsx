import Link from "next/link";
import AppIcon, { type AppIconName } from "@/components/ui/AppIcon";
import type { AppRoute } from "@/types/navigation";

type QuickAction = {
  href: AppRoute;
  icon: AppIconName;
  label: string;
  accentClass: string;
};

const quickActions: QuickAction[] = [
  {
    href: "/tasks",
    icon: "check",
    label: "משימה חדשה",
    accentClass: "bg-amber-50 text-amber-700 ring-amber-100",
  },
  {
    href: "/shopping",
    icon: "shopping",
    label: "להוסיף לקנייה",
    accentClass: "bg-sky-50 text-sky-700 ring-sky-100",
  },
  {
    href: "/finance",
    icon: "finance",
    label: "סריקת קבלה",
    accentClass: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  {
    href: "/birthdays",
    icon: "calendar",
    label: "אירוע משפחתי",
    accentClass: "bg-pink-50 text-pink-700 ring-pink-100",
  },
];

export default function HomeQuickActions() {
  return (
    <nav aria-label="פעולות מהירות" className="grid grid-cols-4 gap-1.5">
      {quickActions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-[18px] border border-[#e8dfd1] bg-white px-1.5 py-2 text-center shadow-[0_6px_16px_rgba(33,43,63,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(33,43,63,0.08)] focus:outline-none focus:ring-2 focus:ring-[#eadfcd]"
        >
          <span
            className={`grid h-9 w-9 place-items-center rounded-2xl ring-1 ${action.accentClass}`}
          >
            <AppIcon name={action.icon} className="h-4.5 w-4.5" />
          </span>
          <span className="w-full text-[11px] font-bold leading-4 text-[#111827]">
            {action.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
