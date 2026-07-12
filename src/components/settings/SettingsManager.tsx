"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { defaultLanguage, isAppLanguage, type AppLanguage } from "@/i18n/config";
import { useLanguage } from "@/i18n/useLanguage";
import { brand } from "@/lib/branding";
import {
  countBackupDataEntries,
  createBackup,
  getBackupFileName,
  parseBackup,
  restoreBackup,
} from "@/lib/dataBackup";
import {
  fetchAiServiceStatus,
  getStoredAiAccessCode,
  setStoredAiAccessCode,
  type AiServiceStatus,
} from "@/services/documentAiClient";
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
  const restoreInputRef = useRef<HTMLInputElement | null>(null);
  const [aiStatus, setAiStatus] = useState<AiServiceStatus | null>(null);
  const [aiAccessCode, setAiAccessCode] = useState("");

  useEffect(() => {
    setAiAccessCode(getStoredAiAccessCode());

    let isActive = true;
    fetchAiServiceStatus().then((status) => {
      if (isActive) {
        setAiStatus(status);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  function saveAiAccessCode() {
    setStoredAiAccessCode(aiAccessCode);
    toast({
      title: aiAccessCode.trim() ? "קוד הגישה נשמר" : "קוד הגישה נמחק",
      description: "הקוד נשמר במכשיר זה בלבד.",
      tone: "success",
    });
  }

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

  function exportBackup() {
    const backup = createBackup();

    if (countBackupDataEntries(backup) === 0) {
      toast({
        title: "אין נתונים לגיבוי",
        description: "עדיין לא נשמר מידע במכשיר הזה.",
        tone: "info",
      });
      return;
    }

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = getBackupFileName();
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast({
      title: "קובץ הגיבוי ירד למכשיר",
      description: "מומלץ לשמור אותו במקום בטוח — למשל בדוא\"ל או בענן.",
      tone: "success",
    });
  }

  async function handleRestoreFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const backup = parseBackup(await file.text());

    if (!backup || countBackupDataEntries(backup) === 0) {
      toast({
        title: "הקובץ אינו גיבוי תקין של Nestly",
        description: "יש לבחור קובץ שיוצא מכפתור \"ייצוא גיבוי\".",
        tone: "danger",
      });
      return;
    }

    const exportedAtLabel = backup.exportedAt
      ? new Date(backup.exportedAt).toLocaleDateString("he-IL")
      : "";
    const approved = await confirm({
      title: "שחזור מגיבוי",
      description: `הגיבוי${exportedAtLabel ? ` מ-${exportedAtLabel}` : ""} כולל ${countBackupDataEntries(backup)} רשומות. נתונים קיימים באותם אזורים יוחלפו בתוכן הגיבוי. להמשיך?`,
      confirmLabel: "שחזר נתונים",
      cancelLabel: "ביטול",
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    const restoredCount = restoreBackup(backup);

    if (restoredCount === null) {
      toast({
        title: "השחזור נכשל",
        description: "אין מספיק מקום באחסון הדפדפן. פנו מקום ונסו שוב.",
        tone: "danger",
      });
      return;
    }

    toast({
      title: "השחזור הושלם",
      description: "האפליקציה תיטען מחדש עם הנתונים המשוחזרים.",
      tone: "success",
    });
    window.setTimeout(() => window.location.reload(), 1200);
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

        <section className="rounded-[24px] border border-white/80 bg-white/90 p-4 text-right shadow-[0_16px_40px_rgba(33,43,63,0.08)]">
          <p className="mb-1 text-xs font-bold text-[#9a6b17]">גיבוי ושחזור</p>
          <h2 className="text-lg font-black text-slate-950">
            הנתונים שלכם — בידיים שלכם
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            כל המידע נשמר בדפדפן במכשיר הזה בלבד. ניקוי היסטוריה או החלפת
            מכשיר ימחקו אותו — לכן מומלץ לייצא גיבוי מדי פעם. את קובץ הגיבוי
            אפשר לשחזר כאן בכל מכשיר.
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={exportBackup}
              className="min-h-12 rounded-2xl bg-[#111827] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#1f2937]"
            >
              ייצוא גיבוי (JSON)
            </button>
            <button
              type="button"
              onClick={() => restoreInputRef.current?.click()}
              className="min-h-12 rounded-2xl border border-[#ebe4d8] bg-[#fffdf8] px-5 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
            >
              שחזור מקובץ גיבוי
            </button>
            <input
              ref={restoreInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleRestoreFile}
              className="hidden"
              aria-hidden="true"
            />
          </div>
        </section>

        <section className="rounded-[24px] border border-white/80 bg-white/90 p-4 text-right shadow-[0_16px_40px_rgba(33,43,63,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={[
                "rounded-full px-3 py-1 text-xs font-black",
                aiStatus?.mode === "live"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600",
              ].join(" ")}
            >
              {aiStatus === null
                ? "בודק חיבור…"
                : aiStatus.mode === "live"
                  ? "AI פעיל"
                  : "מצב בסיסי (ללא AI)"}
            </span>
            <div>
              <p className="mb-1 text-xs font-bold text-[#007aff]">Nestly AI</p>
              <h2 className="text-lg font-black text-slate-950">ניתוח מסמכים חכם</h2>
            </div>
          </div>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            כשה-AI פעיל, סריקת מסמך מזהה אוטומטית ספק, סכום ותאריך תשלום —
            ואתם רק מאשרים. מסמכים נשלחים לניתוח לשירות חיצוני מאובטח, ושום
            דבר לא נשמר בלי אישור שלכם. ללא חיבור AI הכול ממשיך לעבוד במצב
            בסיסי וחינמי.
          </p>

          {aiStatus?.mode === "live" && aiStatus.requiresAccessCode && (
            <div className="mt-3 rounded-2xl border border-[#ebe4d8] bg-[#fffdf8] p-3">
              <p className="text-sm font-bold text-slate-700">
                קוד גישה משפחתי
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                הקוד מגן על השימוש ב-AI. מזינים אותו פעם אחת בכל מכשיר של
                המשפחה.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  type="password"
                  value={aiAccessCode}
                  onChange={(event) => setAiAccessCode(event.target.value)}
                  autoComplete="off"
                  className="min-h-11 min-w-0 flex-1 rounded-2xl border border-[#e6e8ec] bg-white px-4 text-right text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400"
                  placeholder="הזינו את הקוד המשפחתי"
                />
                <button
                  type="button"
                  onClick={saveAiAccessCode}
                  className="min-h-11 rounded-2xl bg-[#111827] px-5 text-sm font-black text-white transition hover:bg-[#1f2937]"
                >
                  שמירה
                </button>
              </div>
            </div>
          )}
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
