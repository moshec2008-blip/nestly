import PageHero from "@/components/layout/PageHero";
import { brand } from "@/lib/branding";

export default function FinanceHeader() {
  return (
    <PageHero
      eyebrow="מרכז כספים"
      title="כספים"
      description={`ניהול הכנסות, הוצאות, תקציבים, דוחות ותזרים במקום אחד מסודר וברור במרחב ${brand.workspaceName}.`}
      showBackHome
    />
  );
}
