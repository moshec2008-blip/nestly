import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";
import ShoppingManager from "@/components/shopping/ShoppingManager";

export default function ShoppingPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="קניות"
        title="קניות"
        description="רשימות קניות משותפות למשפחה, עם פריטים, כמויות, מחירים משוערים, אחראים וסימון רכישה."
        showBackHome
      />

      <ShoppingManager />
    </AppShell>
  );
}
