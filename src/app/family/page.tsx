import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import FamilyTree from "@/components/family/FamilyTree";
import ModuleManager from "@/components/shared/ModuleManager";
import { initialFamilyRecords } from "@/data/modules";
import { storageKeys } from "@/lib/storageKeys";

export default function FamilyPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="משפחה"
        title="משפחה"
        description="ניהול אנשי קשר, אחריות משפחתית, פרטים חשובים ותזכורות לבית."
        showBackHome
      />

      <FamilyTree />

      <ModuleManager
        storageKey={storageKeys.family}
        initialRecords={initialFamilyRecords}
        formTitle="הוספת פריט משפחתי"
        listTitle="מידע משפחתי"
        defaultCategory="משפחה"
      />
    </AppShell>
  );
}
