import BirthdaysManager from "@/components/birthdays/BirthdaysManager";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";

export default function BirthdaysPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="ימי הולדת"
        title="ימי הולדת"
        description="מעקב משפחתי אחר תאריכים עבריים ולועזיים, קרבה, תזכורות וימי הולדת קרובים."
        showBackHome
      />

      <BirthdaysManager />
    </AppShell>
  );
}
