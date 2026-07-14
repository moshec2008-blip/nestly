"use client";

import PageHero from "@/components/layout/PageHero";
import { useLanguage } from "@/i18n/useLanguage";
import { brand } from "@/lib/branding";

const copy = {
  he: {
    eyebrow: "מרכז כספים",
    title: "כספים",
    description: `ניהול הכנסות, הוצאות, תקציבים, דוחות ותזרים במקום אחד מסודר וברור במרחב ${brand.workspaceName}.`,
  },
  en: {
    eyebrow: "Finance Center",
    title: "Finance",
    description:
      "Track income, expenses, budgets, reports and family cash flow in one calm financial view.",
  },
} as const;

export default function FinanceHeader() {
  const { language } = useLanguage();
  const content = language === "en" ? copy.en : copy.he;

  return <PageHero {...content} showBackHome />;
}
