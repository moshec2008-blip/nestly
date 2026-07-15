"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import DemoEntryCard from "@/components/layout/DemoEntryCard";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { useLanguage } from "@/i18n/useLanguage";
import {
  applyAppPreferences,
  defaultAppSettings,
  notifyAppPreferencesChanged,
  readAppSettings,
  type AppSettings,
} from "@/lib/appPreferences";
import { brand } from "@/lib/branding";
import {
  countBackupDataEntries,
  createBackup,
  getBackupFileName,
  parseBackup,
  restoreBackup,
} from "@/lib/dataBackup";
import { storageKeys } from "@/lib/storageKeys";
import {
  fetchAiServiceStatus,
  getStoredAiAccessCode,
  setStoredAiAccessCode,
  type AiServiceStatus,
} from "@/services/documentAiClient";
import { trackTelemetryEvent } from "@/services/telemetry";
import { clearActiveScopedStorageData, writeStorage } from "@/utils/storage";

type SettingCopy = {
  status: {
    language: string;
    local: string;
    ai: string;
    saved: string;
    live: string;
    basic: string;
    checking: string;
  };
  sections: {
    display: string;
    displayDescription: string;
    data: string;
    dataDescription: string;
    ai: string;
    aiDescription: string;
  };
  language: {
    title: string;
    description: string;
    active: string;
  };
  preferences: Record<
    "simpleMode" | "highContrast" | "reducedMotion" | "darkMode",
    { title: string; description: string }
  >;
  density: {
    title: string;
    description: string;
    comfortable: string;
    compact: string;
  };
  backup: {
    title: string;
    description: string;
    export: string;
    restore: string;
    demoTitle: string;
  };
  ai: {
    statusLive: string;
    statusMock: string;
    codeTitle: string;
    codeDescription: string;
    codePlaceholder: string;
    saveCode: string;
    noCode: string;
    savedCode: string;
    clearedCode: string;
    codeDeviceOnly: string;
  };
  reset: {
    display: string;
    familyData: string;
    displayConfirmTitle: string;
    displayConfirmDescription: string;
    displayConfirm: string;
    familyConfirmTitle: string;
    familyConfirmDescription: string;
    familyConfirm: string;
    cancel: string;
    displayResetDone: string;
    dataResetDone: string;
    dataResetDescription: string;
  };
  backupMessages: {
    noDataTitle: string;
    noDataDescription: string;
    exportedTitle: string;
    exportedDescription: string;
    invalidTitle: string;
    invalidDescription: string;
    restoreTitle: string;
    restoreDescription: (date: string, count: number) => string;
    restoreConfirm: string;
    restoreFailedTitle: string;
    restoreFailedDescription: string;
    restoreDoneTitle: string;
    restoreDoneDescription: string;
  };
};

const copyByLanguage: Record<"he" | "en", SettingCopy> = {
  he: {
    status: {
      language: "שפה",
      local: "שמירה",
      ai: "AI",
      saved: "נשמר אוטומטית",
      live: "פעיל",
      basic: "מצב בסיסי",
      checking: "בודק חיבור",
    },
    sections: {
      display: "תצוגה ונגישות",
      displayDescription:
        "כל מה שמשפיע על איך Nestly נראית ומרגישה בכל המסכים.",
      data: "נתונים וגיבוי",
      dataDescription:
        "שמירה מקומית, גיבוי ידני, דמו ואיפוס נתונים בצורה ברורה.",
      ai: "AI ופרטיות",
      aiDescription:
        "מצב ניתוח המסמכים והקוד המשפחתי, בלי לשמור שום דבר בלי אישור.",
    },
    language: {
      title: "שפה וכיוון",
      description: "עברית היא ברירת המחדל. אנגלית זמינה, ושפות נוספות יגיעו בהמשך.",
      active: "שפה פעילה",
    },
    preferences: {
      simpleMode: {
        title: "תצוגה פשוטה",
        description: "פחות עומס, טקסט מעט גדול יותר ופעולות ברורות יותר.",
      },
      highContrast: {
        title: "ניגודיות מוגברת",
        description: "טקסטים, גבולות ופוקוס חזקים יותר לקריאות טובה.",
      },
      reducedMotion: {
        title: "הפחתת תנועה",
        description: "מצמצם אנימציות ומעברים שאינם חיוניים.",
      },
      darkMode: {
        title: "מצב כהה",
        description: "מראה כהה ונעים יותר לעבודה בערב. לא מופעל כברירת מחדל.",
      },
    },
    density: {
      title: "צפיפות ממשק",
      description: "בחירה בין מסך נוח ומרווח לבין תצוגה קומפקטית יותר.",
      comfortable: "נוחה",
      compact: "קומפקטית",
    },
    backup: {
      title: "גיבוי ושחזור",
      description:
        "המידע נשמר בדפדפן של המכשיר. מומלץ לייצא גיבוי לפני איפוס או מעבר מכשיר.",
      export: "ייצוא גיבוי",
      restore: "שחזור מקובץ",
      demoTitle: "רוצים לראות דמו?",
    },
    ai: {
      statusLive: "AI פעיל",
      statusMock: "מצב בסיסי ללא AI",
      codeTitle: "קוד גישה משפחתי",
      codeDescription:
        "אם השרת דורש קוד, שומרים אותו במכשיר הזה בלבד. אין שמירה אוטומטית בענן.",
      codePlaceholder: "הזינו קוד משפחתי",
      saveCode: "שמירה",
      noCode: "לא הוגדר קוד",
      savedCode: "קוד הגישה נשמר",
      clearedCode: "קוד הגישה נמחק",
      codeDeviceOnly: "הקוד נשמר במכשיר זה בלבד.",
    },
    reset: {
      display: "איפוס הגדרות תצוגה",
      familyData: "איפוס נתוני המשפחה",
      displayConfirmTitle: "איפוס הגדרות תצוגה",
      displayConfirmDescription: "לאפס את הגדרות התצוגה לברירת המחדל?",
      displayConfirm: "אפס הגדרות",
      familyConfirmTitle: "איפוס נתוני המשפחה",
      familyConfirmDescription:
        "למחוק את הנתונים שנשמרו במרחב הפעיל ולהתחיל מחדש? מומלץ לייצא גיבוי לפני איפוס.",
      familyConfirm: "אפס נתונים",
      cancel: "ביטול",
      displayResetDone: "הגדרות התצוגה אופסו",
      dataResetDone: "הנתונים אופסו",
      dataResetDescription: "נטען את Nestly מחדש כדי להתחיל נקי.",
    },
    backupMessages: {
      noDataTitle: "אין נתונים לגיבוי",
      noDataDescription: "עדיין לא נשמר מידע במכשיר הזה.",
      exportedTitle: "קובץ הגיבוי ירד למכשיר",
      exportedDescription: "מומלץ לשמור אותו במקום בטוח.",
      invalidTitle: "הקובץ אינו גיבוי תקין של Nestly",
      invalidDescription: "יש לבחור קובץ שנוצר מכפתור ייצוא גיבוי.",
      restoreTitle: "שחזור מגיבוי",
      restoreDescription: (date, count) =>
        `הגיבוי${date ? ` מ-${date}` : ""} כולל ${count} רשומות. נתונים קיימים באותם אזורים יוחלפו. להמשיך?`,
      restoreConfirm: "שחזר נתונים",
      restoreFailedTitle: "השחזור נכשל",
      restoreFailedDescription: "אין מספיק מקום באחסון הדפדפן. פנו מקום ונסו שוב.",
      restoreDoneTitle: "השחזור הושלם",
      restoreDoneDescription: "האפליקציה תיטען מחדש עם הנתונים המשוחזרים.",
    },
  },
  en: {
    status: {
      language: "Language",
      local: "Storage",
      ai: "AI",
      saved: "Saved automatically",
      live: "Live",
      basic: "Basic mode",
      checking: "Checking",
    },
    sections: {
      display: "Appearance and Accessibility",
      displayDescription:
        "Everything that changes how Nestly looks and feels across the app.",
      data: "Data and Backup",
      dataDescription:
        "Local storage, manual backup, demo mode and reset controls in one clear place.",
      ai: "AI and Privacy",
      aiDescription:
        "Document analysis status and family access code, with review before saving.",
    },
    language: {
      title: "Language and direction",
      description:
        "Hebrew is the default. English is available, and more languages can be added later.",
      active: "Active language",
    },
    preferences: {
      simpleMode: {
        title: "Simple view",
        description: "Less visual load, slightly larger text and clearer actions.",
      },
      highContrast: {
        title: "High contrast",
        description: "Stronger text, borders and focus states for better readability.",
      },
      reducedMotion: {
        title: "Reduce motion",
        description: "Reduces non-essential animation and transitions.",
      },
      darkMode: {
        title: "Dark mode",
        description: "A darker evening-friendly appearance. Off by default.",
      },
    },
    density: {
      title: "Interface density",
      description: "Choose between a comfortable layout and a more compact view.",
      comfortable: "Comfortable",
      compact: "Compact",
    },
    backup: {
      title: "Backup and restore",
      description:
        "Family data is saved in this browser. Export a backup before reset or device changes.",
      export: "Export backup",
      restore: "Restore file",
      demoTitle: "Want to see a demo?",
    },
    ai: {
      statusLive: "AI live",
      statusMock: "Basic mode without AI",
      codeTitle: "Family access code",
      codeDescription:
        "If the server requires a code, it is saved on this device only. Nothing is saved to the cloud automatically.",
      codePlaceholder: "Enter family code",
      saveCode: "Save",
      noCode: "No code set",
      savedCode: "Access code saved",
      clearedCode: "Access code cleared",
      codeDeviceOnly: "The code is saved on this device only.",
    },
    reset: {
      display: "Reset appearance settings",
      familyData: "Reset family data",
      displayConfirmTitle: "Reset appearance settings",
      displayConfirmDescription: "Reset appearance preferences to default?",
      displayConfirm: "Reset settings",
      familyConfirmTitle: "Reset family data",
      familyConfirmDescription:
        "Delete the data saved in the active space and start fresh? Export a backup first if needed.",
      familyConfirm: "Reset data",
      cancel: "Cancel",
      displayResetDone: "Appearance settings reset",
      dataResetDone: "Data reset",
      dataResetDescription: "Nestly will reload to start fresh.",
    },
    backupMessages: {
      noDataTitle: "No data to back up",
      noDataDescription: "No family data has been saved on this device yet.",
      exportedTitle: "Backup file downloaded",
      exportedDescription: "Keep it somewhere safe.",
      invalidTitle: "This is not a valid Nestly backup",
      invalidDescription: "Choose a file created by the export backup button.",
      restoreTitle: "Restore backup",
      restoreDescription: (date, count) =>
        `This backup${date ? ` from ${date}` : ""} includes ${count} records. Existing data in the same areas will be replaced. Continue?`,
      restoreConfirm: "Restore data",
      restoreFailedTitle: "Restore failed",
      restoreFailedDescription:
        "There is not enough browser storage available. Free space and try again.",
      restoreDoneTitle: "Restore complete",
      restoreDoneDescription: "The app will reload with the restored data.",
    },
  },
};

function SectionShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-white/80 bg-white/92 p-4 shadow-[0_16px_40px_rgba(33,43,63,0.07)] ring-1 ring-[#eadfcd]/55">
      <div className="mb-3">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function PreferenceSwitch({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-[86px] cursor-pointer items-start justify-between gap-3 rounded-[20px] border border-[#ebe4d8] bg-[#fffdf8] p-3 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_28px_rgba(33,43,63,0.07)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-[#111827]"
      />
      <span className="min-w-0">
        <span className="block text-sm font-black text-slate-950">{title}</span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-slate-600">
          {description}
        </span>
      </span>
    </label>
  );
}

export default function SettingsManager() {
  const { confirm, toast } = useFeedback();
  const { language, direction } = useLanguage();
  const languageKey = language === "en" ? "en" : "he";
  const text = useMemo(() => copyByLanguage[languageKey], [languageKey]);
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiServiceStatus | null>(null);
  const [aiAccessCode, setAiAccessCode] = useState("");
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isActive = true;
    const timeoutId = window.setTimeout(() => {
      setAiAccessCode(getStoredAiAccessCode());
    }, 0);

    fetchAiServiceStatus().then((status) => {
      if (isActive) {
        setAiStatus(status);
      }
    });

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedSettings = readAppSettings(language);

      setSettings(storedSettings);
      applyAppPreferences(storedSettings);
      setHasLoadedStorage(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [language]);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    writeStorage(storageKeys.appSettings, { ...settings, language });
    applyAppPreferences(settings);
    notifyAppPreferencesChanged({ ...settings, language });
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

  function saveAiAccessCode() {
    setStoredAiAccessCode(aiAccessCode);
    toast({
      title: aiAccessCode.trim() ? text.ai.savedCode : text.ai.clearedCode,
      description: text.ai.codeDeviceOnly,
      tone: "success",
    });
  }

  async function resetSettings() {
    const approved = await confirm({
      title: text.reset.displayConfirmTitle,
      description: text.reset.displayConfirmDescription,
      confirmLabel: text.reset.displayConfirm,
      cancelLabel: text.reset.cancel,
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    const nextSettings = { ...defaultAppSettings, language };
    setSettings(nextSettings);
    applyAppPreferences(nextSettings);
    notifyAppPreferencesChanged(nextSettings);
    toast({ title: text.reset.displayResetDone, tone: "success" });
  }

  async function resetFamilyData() {
    const approved = await confirm({
      title: text.reset.familyConfirmTitle,
      description: text.reset.familyConfirmDescription,
      confirmLabel: text.reset.familyConfirm,
      cancelLabel: text.reset.cancel,
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    const removedCount = clearActiveScopedStorageData();

    trackTelemetryEvent({
      name: "family_space_reset",
      module: "settings",
      properties: { removedKeys: removedCount },
    });

    toast({
      title: text.reset.dataResetDone,
      description: text.reset.dataResetDescription,
      tone: "success",
    });

    window.setTimeout(() => window.location.reload(), 900);
  }

  function exportBackup() {
    const backup = createBackup();

    if (countBackupDataEntries(backup) === 0) {
      toast({
        title: text.backupMessages.noDataTitle,
        description: text.backupMessages.noDataDescription,
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
      title: text.backupMessages.exportedTitle,
      description: text.backupMessages.exportedDescription,
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
        title: text.backupMessages.invalidTitle,
        description: text.backupMessages.invalidDescription,
        tone: "danger",
      });
      return;
    }

    const exportedAtLabel = backup.exportedAt
      ? new Date(backup.exportedAt).toLocaleDateString(
          language === "en" ? "en-US" : "he-IL"
        )
      : "";
    const approved = await confirm({
      title: text.backupMessages.restoreTitle,
      description: text.backupMessages.restoreDescription(
        exportedAtLabel,
        countBackupDataEntries(backup)
      ),
      confirmLabel: text.backupMessages.restoreConfirm,
      cancelLabel: text.reset.cancel,
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    const restoredCount = restoreBackup(backup);

    if (restoredCount === null) {
      toast({
        title: text.backupMessages.restoreFailedTitle,
        description: text.backupMessages.restoreFailedDescription,
        tone: "danger",
      });
      return;
    }

    toast({
      title: text.backupMessages.restoreDoneTitle,
      description: text.backupMessages.restoreDoneDescription,
      tone: "success",
    });
    window.setTimeout(() => window.location.reload(), 1200);
  }

  const aiStatusLabel =
    aiStatus === null
      ? text.status.checking
      : aiStatus.mode === "live"
        ? text.ai.statusLive
        : text.ai.statusMock;

  return (
    <section
      className={[
        "space-y-3",
        direction === "rtl" ? "text-right" : "text-left",
      ].join(" ")}
    >
      <div className="grid gap-2 md:grid-cols-3">
        <div className="rounded-[20px] border border-white/80 bg-white/90 p-3 shadow-[0_10px_24px_rgba(33,43,63,0.055)] ring-1 ring-[#eadfcd]/45">
          <p className="text-[11px] font-black text-slate-400">
            {text.status.language}
          </p>
          <p className="mt-1 text-sm font-black text-slate-950">
            {language === "en" ? "English" : "עברית"}
          </p>
        </div>
        <div className="rounded-[20px] border border-white/80 bg-white/90 p-3 shadow-[0_10px_24px_rgba(33,43,63,0.055)] ring-1 ring-[#eadfcd]/45">
          <p className="text-[11px] font-black text-slate-400">
            {text.status.local}
          </p>
          <p className="mt-1 text-sm font-black text-emerald-700">
            {text.status.saved}
          </p>
        </div>
        <div className="rounded-[20px] border border-white/80 bg-white/90 p-3 shadow-[0_10px_24px_rgba(33,43,63,0.055)] ring-1 ring-[#eadfcd]/45">
          <p className="text-[11px] font-black text-slate-400">
            {text.status.ai}
          </p>
          <p className="mt-1 text-sm font-black text-slate-950">
            {aiStatusLabel}
          </p>
        </div>
      </div>

      <SectionShell
        title={text.sections.display}
        description={text.sections.displayDescription}
      >
        <div className="grid gap-2 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[20px] border border-[#ebe4d8] bg-[#fffdf8] p-3">
            <h3 className="text-sm font-black text-slate-950">
              {text.language.title}
            </h3>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {text.language.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-2 ring-1 ring-[#ebe4d8]">
              <span className="text-xs font-black text-slate-600">
                {text.language.active}
              </span>
              <LanguageSwitcher />
            </div>
          </div>

          <div className="rounded-[20px] border border-[#ebe4d8] bg-white p-3">
            <h3 className="text-sm font-black text-slate-950">
              {text.density.title}
            </h3>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {text.density.description}
            </p>
            <div className="mt-3 grid grid-cols-2 rounded-2xl bg-[#f5f0e8] p-1 text-xs font-black">
              <button
                type="button"
                onClick={() => updateSetting("compactMode", false)}
                className={[
                  "min-h-10 rounded-xl transition",
                  !settings.compactMode
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:bg-white/60",
                ].join(" ")}
              >
                {text.density.comfortable}
              </button>
              <button
                type="button"
                onClick={() => updateSetting("compactMode", true)}
                className={[
                  "min-h-10 rounded-xl transition",
                  settings.compactMode
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:bg-white/60",
                ].join(" ")}
              >
                {text.density.compact}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {(
            [
              "simpleMode",
              "highContrast",
              "reducedMotion",
              "darkMode",
            ] as const
          ).map((key) => (
            <PreferenceSwitch
              key={key}
              title={text.preferences[key].title}
              description={text.preferences[key].description}
              checked={settings[key]}
              onChange={(value) => updateSetting(key, value)}
            />
          ))}
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={resetSettings}
            className="min-h-11 rounded-2xl border border-[#ebe4d8] bg-[#fffdf8] px-4 text-xs font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-white"
          >
            {text.reset.display}
          </button>
        </div>
      </SectionShell>

      <SectionShell
        title={text.sections.data}
        description={text.sections.dataDescription}
      >
        <div className="grid gap-2 lg:grid-cols-[1fr_20rem]">
          <div className="rounded-[20px] border border-[#ebe4d8] bg-[#fffdf8] p-3">
            <h3 className="text-sm font-black text-slate-950">
              {text.backup.title}
            </h3>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {text.backup.description}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={exportBackup}
                className="min-h-11 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-4 text-sm font-black text-[#111827] shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
              >
                {text.backup.export}
              </button>
              <button
                type="button"
                onClick={() => restoreInputRef.current?.click()}
                className="min-h-11 rounded-2xl border border-[#d8caba] bg-white px-4 text-sm font-black text-[#111827] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fffdf8]"
              >
                {text.backup.restore}
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
          </div>

          <div className="space-y-2">
            <DemoEntryCard />
            <button
              type="button"
              onClick={resetFamilyData}
              className="min-h-11 w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 transition hover:-translate-y-0.5 hover:bg-rose-100"
            >
              {text.reset.familyData}
            </button>
          </div>
        </div>
      </SectionShell>

      <SectionShell title={text.sections.ai} description={text.sections.aiDescription}>
        <div className="grid gap-2 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[20px] border border-[#ebe4d8] bg-gradient-to-l from-[#eef7ff] via-white to-[#fff8eb] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={[
                  "rounded-full px-3 py-1 text-xs font-black",
                  aiStatus?.mode === "live"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600",
                ].join(" ")}
              >
                {aiStatusLabel}
              </span>
              <p className="text-sm font-black text-slate-950">{brand.productName} AI</p>
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
              {text.sections.aiDescription}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <PreferenceSwitch
              title={languageKey === "en" ? "Smart suggestions" : "הצעות חכמות"}
              description={
                languageKey === "en"
                  ? "Show optional AI/rule-based suggestions inside workflows."
                  : "הצגת הצעות אופציונליות בתוך משימות, קניות ומידע משפחתי."
              }
              checked={settings.aiSuggestionsEnabled}
              onChange={(value) => updateSetting("aiSuggestionsEnabled", value)}
            />
            <PreferenceSwitch
              title={languageKey === "en" ? "Text analysis" : "ניתוח טקסט"}
              description={
                languageKey === "en"
                  ? "Allow Nestly to organize text you type, without saving changes automatically."
                  : "מאפשר ל-Nestly לסדר טקסט שכתבת, בלי לשמור שינויים אוטומטית."
              }
              checked={settings.aiNoteAnalysis}
              onChange={(value) => updateSetting("aiNoteAnalysis", value)}
            />
          </div>

          {aiStatus?.mode === "live" && aiStatus.requiresAccessCode ? (
            <div className="rounded-[20px] border border-[#ebe4d8] bg-[#fffdf8] p-3">
              <h3 className="text-sm font-black text-slate-950">
                {text.ai.codeTitle}
              </h3>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                {text.ai.codeDescription}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  type="password"
                  value={aiAccessCode}
                  onChange={(event) => setAiAccessCode(event.target.value)}
                  autoComplete="off"
                  className={[
                    "min-h-11 min-w-0 flex-1 rounded-2xl border border-[#e6e8ec] bg-white px-4 text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400",
                    direction === "rtl" ? "text-right" : "text-left",
                  ].join(" ")}
                  placeholder={text.ai.codePlaceholder}
                />
                <button
                  type="button"
                  onClick={saveAiAccessCode}
                  className="min-h-11 rounded-2xl border border-[#d8caba] bg-white px-5 text-sm font-black text-[#111827] shadow-sm transition hover:bg-[#fffdf8]"
                >
                  {text.ai.saveCode}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[20px] border border-[#ebe4d8] bg-[#fffdf8] p-3">
              <h3 className="text-sm font-black text-slate-950">
                {text.ai.codeTitle}
              </h3>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                {text.ai.noCode}
              </p>
            </div>
          )}
        </div>
      </SectionShell>
    </section>
  );
}
