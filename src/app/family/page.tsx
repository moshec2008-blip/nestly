import FamilyTree from "@/components/family/FamilyTree";
import AppShell from "@/components/layout/AppShell";
import ModuleManager from "@/components/shared/ModuleManager";
import { initialFamilyRecords } from "@/data/modules";
import { storageKeys } from "@/lib/storageKeys";

export default function FamilyPage() {
  return (
    <AppShell>
      <FamilyTree />

      <details className="rounded-[18px] bg-white/92 p-2.5 text-right shadow-[0_8px_22px_rgba(15,23,42,0.04)] ring-1 ring-[#e6e8ec]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-2 text-sm font-black text-[#111827]">
          <span className="text-xs font-bold text-slate-500">
            מידע, אחריות ותזכורות
          </span>
          <span>מידע משפחתי נוסף</span>
        </summary>
        <div className="mt-2">
          <ModuleManager
            storageKey={storageKeys.family}
            initialRecords={initialFamilyRecords}
            formTitle="הוספת פריט משפחתי"
            listTitle="מידע משפחתי"
            defaultCategory="משפחה"
            addButtonLabel="הוסף פריט"
            itemLabel="פריט משפחתי"
            itemPluralLabel="פריטים משפחתיים"
            titlePlaceholder="שם הפריט"
          />
        </div>
      </details>
    </AppShell>
  );
}
