"use client";

import { useEffect, useState } from "react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { defaultLanguage, isAppLanguage, type AppLanguage } from "@/i18n/config";
import { useLanguage } from "@/i18n/useLanguage";
import { brand } from "@/lib/branding";
import { storageKeys } from "@/lib/storageKeys";
import { readStorage, writeStorage } from "@/utils/storage";

type AppSettings = {
  language: AppLanguage;
  highContrast: boolean;
  compactMode: boolean;
  reducedMotion: boolean;
};

const defaultSettings: AppSettings = {
  language: defaultLanguage,
  highContrast: false,
  compactMode: false,
  reducedMotion: false,
};

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isSettings(value: unknown): value is AppSettings {
  if (!value || typeof value !== "object") {
    return false;
  }

  const settings = value as Partial<AppSettings>;

  return (
    typeof settings.language === "string" &&
    isAppLanguage(settings.language) &&
    isBoolean(settings.highContrast) &&
    isBoolean(settings.compactMode) &&
    isBoolean(settings.reducedMotion)
  );
}

export default function SettingsManager() {
  const { confirm, toast } = useFeedback();
  const { language } = useLanguage();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedSettings = readStorage(
        storageKeys.appSettings,
        defaultSettings,
        isSettings
      );

      setSettings({
        ...defaultSettings,
        ...storedSettings,
        language,
      });
      setHasLoadedStorage(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [language]);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    writeStorage(storageKeys.appSettings, { ...settings, language });
  }, [settings, language, hasLoadedStorage]);

  function updateSetting<Key extends keyof AppSettings>(
    key: Key,
    value: AppSettings[Key]
  ) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }));
  }

  async function resetSettings() {
    const approved = await confirm({
      title: "איפוס הגדרות תצוגה",
      description: "לאפס את הגדרות התצוגה לברירת המחדל?",
      confirmLabel: "אפס הגדרות",
      cancelLabel: "ביטול",
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    setSettings({ ...defaultSettings, language });
    toast({
      title: "הגדרות התצוגה אופסו",
      tone: "success",
    });
  }

  const preferenceCards = [
    {
      key: "highContrast" as const,
      title: "ניגודיות מוגברת",
      description: "מחזקת קריאות טקסט וכפתורים למי שמעדיף ממשק ברור יותר.",
      checked: settings.highContrast,
    },
    {
      key: "compactMode" as const,
      title: "תצוגה קומפקטית",
      description: "מציגה יותר מידע במסך אחד, מתאים לעבודה יומיומית מהירה.",
      checked: settings.compactMode,
    },
    {
      key: "reducedMotion" as const,
      title: "הפחתת תנועה",
      description: "מצמצמת אנימציות ומעברים למי שרגיש לתנועה במסך.",
      checked: settings.reducedMotion,
    },
  ];

  return (
    <section className="grid gap-3 lg:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        <section className="rounded-[24px] border border-white/80 bg-white/90 p-4 text-right shadow-[0_16px_40px_rgba(33,43,63,0.08)]">
          <p className="mb-1 text-xs font-bold text-[#007aff]">שפה וכיוון</p>
          <h2 className="text-lg font-black text-slate-950">ריבוי שפות</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            עברית נשארת ברירת המחדל. התשתית כבר מוכנה לשפות נוספות ולכיוון
            כתיבה RTL/LTR דרך שכבת layout משותפת.
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ebe4d8] bg-[#fffdf8] p-3">
            <p className="text-sm font-bold text-slate-700">שפה פעילה</p>
            <LanguageSwitcher />
          </div>
        </section>

        <section className="rounded-[24px] border border-white/80 bg-white/90 p-4 text-right shadow-[0_16px_40px_rgba(33,43,63,0.08)]">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-1 text-xs font-bold text-[#9a6b17]">
                נגישות ותצוגה
              </p>
              <h2 className="text-lg font-black text-slate-950">
                העדפות ממשק
              </h2>
            </div>
            <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
              נשמר אוטומטית
            </span>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {preferenceCards.map((item) => (
              <label
                key={item.key}
                className="group flex min-h-[112px] cursor-pointer flex-col justify-between rounded-2xl border border-[#ebe4d8] bg-[#fffdf8] p-3 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_28px_rgba(33,43,63,0.08)]"
              >
                <span className="flex items-start justify-between gap-3">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(event) =>
                      updateSetting(item.key, event.target.checked)
                    }
                    className="mt-1 h-5 w-5 accent-[#111827]"
                  />
                  <span className="text-right">
                    <span className="block text-sm font-black text-slate-950">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">
                      {item.description}
                    </span>
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>

      <aside className="rounded-[24px] border border-white/80 bg-gradient-to-br from-[#fff8eb] to-white p-4 text-right shadow-[0_16px_40px_rgba(33,43,63,0.08)]">
        <p className="mb-1 text-xs font-bold text-slate-500">אודות</p>
        <h2 className="text-xl font-black text-slate-950">{brand.productName}</h2>
        <p className="mt-2 text-sm font-black text-[#9a6b17]">
          {brand.taglineHe}
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          מרחב משפחתי: {brand.workspaceName}
        </p>

        <div className="my-4 h-px bg-[#ebe4d8]" />

        <p className="mb-2 text-sm font-bold text-slate-600">
          נתונים מקומיים
        </p>
        <h3 className="text-lg font-black text-slate-950">שמירה בדפדפן</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          כספים, משימות ושאר המודולים נשמרים כרגע מקומית בדפדפן. המבנה מוכן
          לחיבור עתידי של משתמשים, הרשאות וסנכרון.
        </p>

        <button
          type="button"
          onClick={resetSettings}
          className="mt-4 w-full rounded-2xl bg-[#111827] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#1f2937]"
        >
          איפוס הגדרות תצוגה
        </button>
      </aside>
    </section>
  );
}
