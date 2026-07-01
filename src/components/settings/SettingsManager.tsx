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
      description: "לאפס את הגדרות התצוגה לברירת מחדל?",
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

  return (
    <section className="grid gap-3 lg:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        <section className="rounded-[22px] bg-slate-800/58 p-4 text-right text-[#fff9ea] shadow-[0_12px_34px_rgba(2,6,23,0.18)] backdrop-blur-xl">
          <p className="mb-1 text-xs text-[#a9a295]">שפה</p>
          <h2 className="text-lg font-black">ריבוי שפות</h2>
          <p className="mt-2 text-sm leading-6 text-[#a9a295]">
            עברית נשארת שפת ברירת המחדל. התשתית מוכנה לשפות נוספות ולכיוון
            כתיבה RTL/LTR דרך שכבת layout משותפת.
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/[0.055] p-3">
            <p className="text-sm font-bold text-[#d7cfbf]">שפה פעילה</p>
            <LanguageSwitcher />
          </div>
        </section>

        <section className="rounded-[22px] bg-slate-800/58 p-4 text-right text-[#fff9ea] shadow-[0_12px_34px_rgba(2,6,23,0.18)] backdrop-blur-xl">
          <p className="mb-1 text-xs text-[#a9a295]">נגישות ותצוגה</p>
          <h2 className="text-lg font-black">העדפות ממשק</h2>
          <p className="mt-1 text-xs font-bold text-[#d8b470]">
            נשמר אוטומטית בדפדפן
          </p>

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <label className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.055] p-3">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(event) =>
                  updateSetting("highContrast", event.target.checked)
                }
                className="h-5 w-5"
              />
              <span className="text-sm font-bold text-[#d7cfbf]">
                ניגודיות מוגברת
              </span>
            </label>

            <label className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.055] p-3">
              <input
                type="checkbox"
                checked={settings.compactMode}
                onChange={(event) =>
                  updateSetting("compactMode", event.target.checked)
                }
                className="h-5 w-5"
              />
              <span className="text-sm font-bold text-[#d7cfbf]">
                תצוגה צפופה יותר
              </span>
            </label>

            <label className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.055] p-3">
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(event) =>
                  updateSetting("reducedMotion", event.target.checked)
                }
                className="h-5 w-5"
              />
              <span className="text-sm font-bold text-[#d7cfbf]">
                הפחתת תנועה
              </span>
            </label>
          </div>
          <p className="mt-3 text-xs leading-5 text-[#a9a295]">
            הפחתת תנועה מיועדת למשתמשים שרגישים לאנימציות ומעברים.
          </p>
        </section>
      </div>

      <aside className="rounded-[22px] bg-slate-800/58 p-4 text-right text-[#fff9ea] shadow-[0_12px_34px_rgba(2,6,23,0.18)] backdrop-blur-xl">
        <p className="mb-1 text-xs text-[#a9a295]">אודות</p>
        <h2 className="text-xl font-black">{brand.productName}</h2>
        <p className="mt-2 text-sm font-bold text-[#d8b470]">
          {brand.taglineHe}
        </p>
        <p className="mt-3 text-sm leading-6 text-[#a9a295]">
          מרחב משפחתי: {brand.workspaceName}
        </p>

        <div className="my-4 h-px bg-white/10" />

        <p className="mb-2 text-sm text-[#a9a295]">נתונים מקומיים</p>
        <h3 className="text-lg font-black">שמירה בדפדפן</h3>
        <p className="mt-3 text-sm leading-6 text-[#a9a295]">
          כספים, משימות ושאר המודולים נשמרים כרגע מקומית בדפדפן. המבנה מוכן
          לחיבור עתידי של משתמשים, הרשאות וסנכרון.
        </p>

        <button
          type="button"
          onClick={resetSettings}
          className="mt-4 w-full rounded-2xl bg-[#f4e7c8] px-5 py-3 text-sm font-black text-[#080b16] transition hover:bg-[#fff3d6]"
        >
          איפוס הגדרות תצוגה
        </button>
      </aside>
    </section>
  );
}
