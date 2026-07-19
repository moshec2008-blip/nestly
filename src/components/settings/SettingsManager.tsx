"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useSession } from "next-auth/react";
import DemoEntryCard from "@/components/layout/DemoEntryCard";
import AppIcon from "@/components/ui/AppIcon";
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
import {
  getActiveFamilySpace,
  getFamilySpaceEventName,
  type FamilySpace,
} from "@/lib/familySpace";
import {
  getVisibleIntegrationProviders,
  type IntegrationStatus,
} from "@/lib/integrations";
import {
  moveHomeSection,
  updateHomeSectionVisibility,
  updateQuickActionPinned,
} from "@/lib/personalization";
import {
  submitBetaFeedback,
  type BetaFeedbackType,
} from "@/lib/productInsights";
import { storageKeys } from "@/lib/storageKeys";
import { usePersonalization } from "@/hooks/usePersonalization";
import type { HomeSectionId, QuickActionId } from "@/types/personalization";
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

const feedbackAreas = [
  { value: "general", he: "כללי", en: "General" },
  { value: "home", he: "דף הבית", en: "Home" },
  { value: "tasks", he: "משימות", en: "Tasks" },
  { value: "shopping", he: "קניות", en: "Shopping" },
  { value: "finance", he: "כספים", en: "Finance" },
  { value: "family", he: "מידע משפחתי", en: "Family" },
  { value: "events", he: "אירועי משפחה", en: "Family Events" },
  { value: "vehicles", he: "רכבים", en: "Vehicles" },
  { value: "health", he: "בריאות", en: "Health" },
  { value: "documents", he: "מסמכים", en: "Documents" },
  { value: "capture", he: "לכידה ו-AI", en: "Capture and AI" },
  { value: "settings", he: "הגדרות", en: "Settings" },
] as const;

const defaultFeedbackEmail = "moshe.c2008@gmail.com";

const feedbackTypes: Array<{
  value: BetaFeedbackType;
  he: string;
  en: string;
}> = [
  { value: "bug", he: "תקלה", en: "Bug" },
  { value: "suggestion", he: "הצעה", en: "Suggestion" },
  { value: "confusing", he: "לא ברור", en: "Confusing" },
  { value: "love", he: "אהבתי", en: "Love it" },
];

const integrationStatusClass: Record<IntegrationStatus, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  setup_required: "bg-amber-50 text-amber-700 ring-amber-100",
  coming_soon: "bg-slate-100 text-slate-600 ring-slate-200",
  disabled: "bg-slate-100 text-slate-400 ring-slate-200",
};

function getIntegrationStatusLabel(
  status: IntegrationStatus,
  languageKey: "he" | "en"
) {
  const labels: Record<IntegrationStatus, Record<"he" | "en", string>> = {
    available: { he: "פעיל", en: "Active" },
    setup_required: { he: "דרוש חיבור", en: "Setup required" },
    coming_soon: { he: "בקרוב", en: "Coming soon" },
    disabled: { he: "לא פעיל", en: "Disabled" },
  };

  return labels[status][languageKey];
}

function normalizeAccountKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_");
}

export default function SettingsManager() {
  const { confirm, toast } = useFeedback();
  const { language, direction } = useLanguage();
  const personalization = usePersonalization();
  const { data: session, status } = useSession();
  const languageKey = language === "en" ? "en" : "he";
  const text = useMemo(() => copyByLanguage[languageKey], [languageKey]);
  const integrationProviders = useMemo(
    () => getVisibleIntegrationProviders(),
    []
  );
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiServiceStatus | null>(null);
  const [aiAccessCode, setAiAccessCode] = useState("");
  const [feedbackType, setFeedbackType] =
    useState<BetaFeedbackType>("suggestion");
  const [feedbackArea, setFeedbackArea] = useState("general");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackContact, setFeedbackContact] = useState("");
  const [isDangerZoneUnlocked, setIsDangerZoneUnlocked] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState("");
  const [activeFamilySpace, setActiveFamilySpace] =
    useState<FamilySpace | null>(null);
  const restoreInputRef = useRef<HTMLInputElement | null>(null);
  const isAuthenticated = status === "authenticated";
  const accountKey =
    session?.user?.email || session?.user?.id || session?.user?.name || "";
  const isFamilySpaceOwner =
    !isAuthenticated ||
    Boolean(
      accountKey &&
        activeFamilySpace?.ownerUserKey === normalizeAccountKey(accountKey)
    );
  const canUnlockDangerZone = status !== "loading" && isFamilySpaceOwner;
  const requiredResetPhrase = languageKey === "en" ? "RESET DATA" : "אפס נתונים";
  const canRequestFamilyReset = canUnlockDangerZone && isDangerZoneUnlocked;
  const canResetFamilyData =
    canRequestFamilyReset && resetConfirmationText.trim() === requiredResetPhrase;
  const homeSectionLabels: Record<HomeSectionId, { he: string; en: string }> = {
    quickActions: { he: "פעולות מהירות", en: "Quick actions" },
    importantToday: { he: "מה חשוב היום", en: "Today brief" },
    moreAreas: { he: "עוד בבית", en: "More areas" },
  };
  const quickActionLabels: Record<QuickActionId, { he: string; en: string }> = {
    shopping: { he: "רשימת קניות", en: "Shopping list" },
    tasks: { he: "משימות לביצוע", en: "Open tasks" },
    finance: { he: "תקציב משפחתי", en: "Family budget" },
    events: { he: "אירועים", en: "Events" },
    scanReceipt: { he: "סריקת קבלה", en: "Scan receipt" },
  };

  useEffect(() => {
    function syncFamilySpace() {
      setActiveFamilySpace(getActiveFamilySpace());
    }

    syncFamilySpace();
    window.addEventListener(getFamilySpaceEventName(), syncFamilySpace);

    return () => {
      window.removeEventListener(getFamilySpaceEventName(), syncFamilySpace);
    };
  }, []);

  useEffect(() => {
    if (canUnlockDangerZone) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsDangerZoneUnlocked(false);
      setResetConfirmationText("");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [canUnlockDangerZone]);

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

  function openFeedbackEmail() {
    const suggestion = feedbackText.trim();

    if (!suggestion) {
      toast({
        title: languageKey === "en" ? "Write a suggestion first" : "כתבו הצעה קצרה קודם",
        description:
          languageKey === "en"
            ? "A few words are enough. The email will open before anything is sent."
            : "מספיק כמה מילים. המייל ייפתח לפני שליחה.",
        tone: "info",
      });
      return;
    }

    const selectedArea =
      feedbackAreas.find((area) => area.value === feedbackArea) ??
      feedbackAreas[0];
    const selectedType =
      feedbackTypes.find((type) => type.value === feedbackType) ??
      feedbackTypes[1];
    const savedFeedback = submitBetaFeedback({
      type: feedbackType,
      area: selectedArea.value,
      text: suggestion,
      contact: feedbackContact,
    });
    const areaLabel = selectedArea[languageKey];
    const typeLabel = selectedType[languageKey];
    const recipient =
      process.env.NEXT_PUBLIC_FEEDBACK_EMAIL ?? defaultFeedbackEmail;
    const subject =
      languageKey === "en"
        ? `Nestly feedback - ${typeLabel} - ${areaLabel}`
        : `Nestly - ${typeLabel}: ${areaLabel}`;
    const bodyLines = [
      languageKey === "en" ? `Area: ${areaLabel}` : `אזור באפליקציה: ${areaLabel}`,
      languageKey === "en" ? `Type: ${typeLabel}` : `סוג פידבק: ${typeLabel}`,
      languageKey === "en"
        ? `Page: ${savedFeedback.page || "Unknown"}`
        : `עמוד: ${savedFeedback.page || "לא ידוע"}`,
      languageKey === "en"
        ? `App version: ${savedFeedback.appVersion}`
        : `גרסה: ${savedFeedback.appVersion}`,
      languageKey === "en"
        ? `Browser: ${savedFeedback.browser}`
        : `דפדפן: ${savedFeedback.browser}`,
      languageKey === "en"
        ? `Screen: ${savedFeedback.screen}`
        : `מסך: ${savedFeedback.screen}`,
      feedbackContact.trim()
        ? languageKey === "en"
          ? `Contact: ${feedbackContact.trim()}`
          : `פרטי קשר: ${feedbackContact.trim()}`
        : "",
      "",
      languageKey === "en" ? "Suggestion:" : "הצעה:",
      suggestion,
      "",
      languageKey === "en"
        ? "Sent from Nestly settings. No content was saved automatically."
        : "נשלח מתוך ההגדרות של Nestly. שום תוכן לא נשמר אוטומטית.",
    ].filter(Boolean);

    trackTelemetryEvent({
      name: "feedback_email_opened",
      module: "settings",
      properties: {
        type: feedbackType,
        area: selectedArea.value,
        hasContact: Boolean(feedbackContact.trim()),
        recipientConfigured: Boolean(recipient),
      },
    });

    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    toast({
      title: languageKey === "en" ? "Opening email" : "פותח מייל לשליחה",
      description:
        languageKey === "en"
          ? "Feedback was saved locally without private content. You can review the email before sending."
          : "הפידבק נשמר מקומית בלי תוכן פרטי. אפשר לעבור על המייל לפני ששולחים.",
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
    if (!canUnlockDangerZone) {
      toast({
        title:
          languageKey === "en"
            ? "Owner permission required"
            : "נדרשת הרשאת בעלים",
        description:
          languageKey === "en"
            ? "Only the family space owner can reset family history."
            : "רק בעל המרחב המשפחתי יכול לאפס את כל ההיסטוריה המשפחתית.",
        tone: "warning",
      });
      return;
    }

    if (!canRequestFamilyReset) {
      toast({
        title:
          languageKey === "en"
            ? "Admin approval required"
            : "נדרשת הרשאת מנהל",
        description:
          languageKey === "en"
            ? "Unlock the dangerous action area before resetting family data."
            : "יש לבטל נעילה של אזור הפעולות המסוכנות לפני איפוס נתוני משפחה.",
        tone: "warning",
      });
      return;
    }

    if (!canResetFamilyData) {
      toast({
        title:
          languageKey === "en"
            ? "Confirmation phrase is missing"
            : "חסר משפט אישור",
        description:
          languageKey === "en"
            ? `Type ${requiredResetPhrase} exactly before resetting data.`
            : `יש להקליד בדיוק: ${requiredResetPhrase}`,
        tone: "warning",
      });
      return;
    }

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

    const finalApproval = await confirm({
      title:
        languageKey === "en"
          ? "Last check before deletion"
          : "בדיקה אחרונה לפני מחיקה",
      description:
        languageKey === "en"
          ? "This will delete the active family space data from this device. Continue?"
          : "הפעולה תמחק מהמכשיר את נתוני המרחב המשפחתי הפעיל. להמשיך?",
      confirmLabel:
        languageKey === "en" ? "Delete family data" : "מחק נתוני משפחה",
      cancelLabel: text.reset.cancel,
      tone: "danger",
    });

    if (!finalApproval) {
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

    setResetConfirmationText("");
    setIsDangerZoneUnlocked(false);
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

        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <PreferenceSwitch
            title={languageKey === "en" ? "Floating capture button" : "כפתור לכידה צף"}
            description={
              languageKey === "en"
                ? "Show the movable Capture button above the app. Turn it off if it gets in the way."
                : "מציג את כפתור הלכידה הצף מעל האפליקציה. אפשר לכבות אם הוא מפריע."
            }
            checked={settings.showFloatingCapture}
            onChange={(value) => updateSetting("showFloatingCapture", value)}
          />
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
        title={languageKey === "en" ? "Personalization" : "התאמה אישית"}
        description={
          languageKey === "en"
            ? "Choose what appears on Home and which actions stay close at hand."
            : "בחרו מה יופיע בדף הבית ואילו פעולות יהיו זמינות מהר."
        }
      >
        <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[20px] border border-[#ebe4d8] bg-[#fffdf8] p-3">
            <h3 className="text-sm font-black text-slate-950">
              {languageKey === "en" ? "Home sections" : "אזורי דף הבית"}
            </h3>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {languageKey === "en"
                ? "Hide sections that are not useful today, or change their order."
                : "אפשר להסתיר אזורים שלא שימושיים כרגע, או לשנות את הסדר שלהם."}
            </p>

            <div className="mt-3 space-y-2">
              {personalization.homeSections.map((section, index) => (
                <div
                  key={section.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white p-2 ring-1 ring-[#ebe4d8]"
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveHomeSection(section.id, -1)}
                      disabled={index === 0}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-[#e0d6c8] bg-[#fffdf8] text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={
                        languageKey === "en" ? "Move section up" : "העבר למעלה"
                      }
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveHomeSection(section.id, 1)}
                      disabled={index === personalization.homeSections.length - 1}
                      className="grid h-9 w-9 place-items-center rounded-xl border border-[#e0d6c8] bg-[#fffdf8] text-xs font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={
                        languageKey === "en" ? "Move section down" : "העבר למטה"
                      }
                    >
                      ↓
                    </button>
                  </div>
                  <PreferenceSwitch
                    title={homeSectionLabels[section.id][languageKey]}
                    description={
                      languageKey === "en"
                        ? "Visible on the Home page"
                        : "מוצג בדף הבית"
                    }
                    checked={section.visible}
                    onChange={(value) =>
                      updateHomeSectionVisibility(section.id, value)
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] border border-[#ebe4d8] bg-white p-3">
            <h3 className="text-sm font-black text-slate-950">
              {languageKey === "en" ? "Pinned quick actions" : "פעולות מוצמדות"}
            </h3>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {languageKey === "en"
                ? "Keep only the actions your family uses most."
                : "השאירו רק את הפעולות שהמשפחה באמת משתמשת בהן."}
            </p>

            <div className="mt-3 grid gap-2">
              {personalization.quickActions.map((action) => (
                <PreferenceSwitch
                  key={action.id}
                  title={quickActionLabels[action.id][languageKey]}
                  description={
                    languageKey === "en"
                      ? "Show in Home quick actions"
                      : "הצג בפעולות המהירות בדף הבית"
                  }
                  checked={action.pinned}
                  onChange={(value) => updateQuickActionPinned(action.id, value)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="rounded-[20px] border border-[#ebe4d8] bg-white p-3">
            <h3 className="text-sm font-black text-slate-950">
              {languageKey === "en" ? "Favorites" : "מועדפים"}
            </h3>
            <div className="mt-3 space-y-2">
              {personalization.favorites.slice(0, 5).map((favorite) => (
                <a
                  key={favorite.id}
                  href={favorite.route}
                  className="block rounded-2xl bg-[#fffdf8] px-3 py-2 text-sm font-black text-slate-800 ring-1 ring-[#ebe4d8]"
                >
                  {favorite.title}
                </a>
              ))}
              {personalization.favorites.length === 0 ? (
                <p className="rounded-2xl bg-[#fffdf8] px-3 py-4 text-sm font-semibold text-slate-500">
                  {languageKey === "en"
                    ? "Favorites you mark in modules will appear here."
                    : "מועדפים שתסמנו במודולים יופיעו כאן."}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[20px] border border-[#ebe4d8] bg-white p-3">
            <h3 className="text-sm font-black text-slate-950">
              {languageKey === "en" ? "Saved views" : "תצוגות שמורות"}
            </h3>
            <div className="mt-3 space-y-2">
              {personalization.savedViews.slice(0, 5).map((view) => (
                <a
                  key={view.id}
                  href={view.route}
                  className="block rounded-2xl bg-[#fffdf8] px-3 py-2 ring-1 ring-[#ebe4d8]"
                >
                  <span className="block text-sm font-black text-slate-800">
                    {view.title}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                    {view.description}
                  </span>
                </a>
              ))}
              {personalization.savedViews.length === 0 ? (
                <p className="rounded-2xl bg-[#fffdf8] px-3 py-4 text-sm font-semibold text-slate-500">
                  {languageKey === "en"
                    ? "Saved filters from modules will appear here."
                    : "פילטרים שמורים ממודולים יופיעו כאן."}
                </p>
              ) : null}
            </div>
          </div>
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
          </div>
        </div>
      </SectionShell>

      <SectionShell
        title={languageKey === "en" ? "Connected accounts" : "חשבונות מחוברים"}
        description={
          languageKey === "en"
            ? "A platform layer for future integrations. Only fully connected services will become active here."
            : "שכבת תשתית לחיבורים עתידיים. רק שירותים שמחוברים באמת יוצגו כאן כפעילים."
        }
      >
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {integrationProviders.map((provider) => {
            const description =
              languageKey === "en"
                ? provider.descriptionEn
                : provider.descriptionHe;
            const statusLabel = getIntegrationStatusLabel(
              provider.status,
              languageKey
            );
            const isConnectable = provider.status === "available";

            return (
              <article
                key={provider.id}
                className="rounded-[20px] border border-[#ebe4d8] bg-[#fffdf8] p-3 shadow-[0_10px_24px_rgba(33,43,63,0.045)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-[#334155] shadow-sm ring-1 ring-[#edf0f4]">
                    <AppIcon name={provider.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <span
                        className={[
                          "rounded-full px-2 py-1 text-[11px] font-black ring-1",
                          integrationStatusClass[provider.status],
                        ].join(" ")}
                      >
                        {statusLabel}
                      </span>
                      <h3 className="text-sm font-black text-slate-950">
                        {provider.name}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                      {description}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-500 ring-1 ring-[#edf0f4]">
                    {provider.requiresOAuth
                      ? languageKey === "en"
                        ? "OAuth required"
                        : "דורש OAuth"
                      : languageKey === "en"
                        ? "Server key"
                        : "מפתח שרת"}
                  </span>
                  {isConnectable ? (
                    <button
                      type="button"
                      onClick={() =>
                        trackTelemetryEvent({
                          name: "integration_status_viewed",
                          module: "settings",
                          properties: { provider: provider.id },
                        })
                      }
                      className="min-h-10 rounded-2xl border border-[#d8caba] bg-white px-4 text-xs font-black text-slate-700 shadow-sm transition hover:bg-[#fff8eb]"
                    >
                      {languageKey === "en" ? "Manage" : "ניהול"}
                    </button>
                  ) : (
                    // לא לחצן: אינטגרציה שעוד לא זמינה מוצגת כסטטוס, לא כפעולה מתה.
                    <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-black text-slate-400">
                      {languageKey === "en" ? "Coming soon" : "בקרוב"}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </SectionShell>

      <SectionShell
        title={languageKey === "en" ? "Admin danger zone" : "אזור מנהל מסוכן"}
        description={
          languageKey === "en"
            ? "Actions here can remove family history. They are intentionally locked and require explicit confirmation."
            : "פעולות כאן יכולות למחוק היסטוריה משפחתית. לכן הן נעולות ודורשות אישור מפורש."
        }
      >
        <div className="rounded-[22px] border border-rose-200 bg-rose-50/70 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_18rem]">
            <div>
              <p className="text-sm font-black text-rose-800">
                {text.reset.familyData}
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-rose-700">
                {languageKey === "en"
                  ? "This action deletes the active family data stored on this device. Export a backup first. Connected accounts require family-space owner permission."
                  : "הפעולה מוחקת מהמכשיר את נתוני המרחב המשפחתי הפעיל. מומלץ לייצא גיבוי קודם. בחשבון מחובר, רק בעל המרחב יכול לבצע איפוס."}
              </p>

              <label className="mt-3 flex cursor-pointer items-start justify-end gap-3 rounded-2xl bg-white/80 p-3 text-sm font-bold text-slate-700 ring-1 ring-rose-100">
                <input
                  type="checkbox"
                  checked={isDangerZoneUnlocked}
                  disabled={!canUnlockDangerZone}
                  onChange={(event) =>
                    setIsDangerZoneUnlocked(event.target.checked)
                  }
                  className="mt-1 h-5 w-5 accent-rose-700 disabled:cursor-not-allowed disabled:opacity-45"
                />
                <span>
                  {isAuthenticated
                    ? languageKey === "en"
                      ? "Connected account detected. Keep this unlocked only while performing the reset."
                      : "זוהה חשבון מחובר. השאירו פתוח רק בזמן ביצוע האיפוס."
                    : languageKey === "en"
                      ? "I understand this is an admin-only destructive action in Basic mode."
                      : "אני מבין שזו פעולה הרסנית שמיועדת רק לבעל הרשאה במצב בסיסי."}
                </span>
              </label>
              <p
                className={[
                  "mt-2 rounded-2xl px-3 py-2 text-xs font-black leading-5",
                  canUnlockDangerZone
                    ? "bg-white/75 text-rose-700 ring-1 ring-rose-100"
                    : "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
                ].join(" ")}
              >
                {canUnlockDangerZone
                  ? languageKey === "en"
                    ? "Permission confirmed: this device/account can unlock the reset flow."
                    : "הרשאה מאושרת: החשבון או המכשיר הזה יכול לפתוח את תהליך האיפוס."
                  : languageKey === "en"
                    ? "Locked: only the family-space owner can reset family history."
                    : "נעול: רק בעל המרחב המשפחתי יכול לאפס את היסטוריית המשפחה."}
              </p>
            </div>

            <div className="rounded-[20px] bg-white p-3 ring-1 ring-rose-100">
              <label className="block">
                <span className="text-xs font-black text-rose-700">
                  {languageKey === "en"
                    ? `Type ${requiredResetPhrase}`
                    : `הקלד/י בדיוק: ${requiredResetPhrase}`}
                </span>
                <input
                  value={resetConfirmationText}
                  onChange={(event) => setResetConfirmationText(event.target.value)}
                  disabled={!canRequestFamilyReset}
                  className="mt-2 min-h-11 w-full rounded-2xl border border-rose-200 bg-white px-4 text-sm font-black text-slate-950 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder={requiredResetPhrase}
                />
              </label>

              <button
                type="button"
                onClick={resetFamilyData}
                disabled={!canResetFamilyData}
                className="mt-3 min-h-11 w-full rounded-2xl border border-rose-200 bg-rose-600 px-4 text-sm font-black text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-100 disabled:text-rose-400"
              >
                {text.reset.familyData}
              </button>
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        title={languageKey === "en" ? "Suggestions and feedback" : "הצעות ושיפור"}
        description={
          languageKey === "en"
            ? "A quick way to send product feedback by email, without saving private family content."
            : "דרך קצרה לשלוח רעיון לשיפור במייל, בלי לשמור תוכן משפחתי פרטי."
        }
      >
        <div className="grid gap-3 lg:grid-cols-[18rem_1fr]">
          <div className="rounded-[20px] border border-[#ebe4d8] bg-gradient-to-l from-[#f7fbff] via-white to-[#fff8eb] p-3">
            <h3 className="text-sm font-black text-slate-950">
              {languageKey === "en" ? "What area is this about?" : "לאיזה אזור זה קשור?"}
            </h3>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {languageKey === "en"
                ? "Choose the closest area so the suggestion arrives with context."
                : "בחרו את האזור הקרוב ביותר, כדי שההצעה תגיע עם הקשר ברור."}
            </p>
            <select
              value={feedbackType}
              onChange={(event) =>
                setFeedbackType(event.target.value as BetaFeedbackType)
              }
              className={[
                "mt-3 min-h-11 w-full rounded-2xl border border-[#d8caba] bg-white px-4 text-sm font-black text-slate-900 outline-none transition focus:border-[#8aa3c2] focus:ring-4 focus:ring-[#dbeafe]",
                direction === "rtl" ? "text-right" : "text-left",
              ].join(" ")}
              aria-label={
                languageKey === "en" ? "Feedback type" : "סוג פידבק"
              }
            >
              {feedbackTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type[languageKey]}
                </option>
              ))}
            </select>
            <select
              value={feedbackArea}
              onChange={(event) => setFeedbackArea(event.target.value)}
              className={[
                "mt-3 min-h-11 w-full rounded-2xl border border-[#d8caba] bg-white px-4 text-sm font-black text-slate-900 outline-none transition focus:border-[#8aa3c2] focus:ring-4 focus:ring-[#dbeafe]",
                direction === "rtl" ? "text-right" : "text-left",
              ].join(" ")}
            >
              {feedbackAreas.map((area) => (
                <option key={area.value} value={area.value}>
                  {area[languageKey]}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-[20px] border border-[#ebe4d8] bg-[#fffdf8] p-3">
            <label className="block">
              <span className="text-sm font-black text-slate-950">
                {languageKey === "en" ? "What should be improved?" : "מה כדאי לשפר?"}
              </span>
              <textarea
                value={feedbackText}
                onChange={(event) => setFeedbackText(event.target.value)}
                rows={4}
                maxLength={900}
                placeholder={
                  languageKey === "en"
                    ? "Write a short suggestion, friction point or idea..."
                    : "כתבו בקצרה רעיון, בעיה או משהו שהיה הופך את Nestly לטובה יותר..."
                }
                className={[
                  "mt-2 w-full resize-none rounded-2xl border border-[#e0d6c8] bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#8aa3c2] focus:ring-4 focus:ring-[#dbeafe]",
                  direction === "rtl" ? "text-right" : "text-left",
                ].join(" ")}
              />
            </label>

            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
              <label className="block">
                <span className="text-xs font-black text-slate-500">
                  {languageKey === "en" ? "Contact details, optional" : "פרטי קשר, לא חובה"}
                </span>
                <input
                  value={feedbackContact}
                  onChange={(event) => setFeedbackContact(event.target.value)}
                  placeholder={languageKey === "en" ? "Name or email" : "שם או מייל"}
                  className={[
                    "mt-1 min-h-11 w-full rounded-2xl border border-[#e0d6c8] bg-white px-4 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#8aa3c2] focus:ring-4 focus:ring-[#dbeafe]",
                    direction === "rtl" ? "text-right" : "text-left",
                  ].join(" ")}
                />
              </label>

              <button
                type="button"
                onClick={openFeedbackEmail}
                disabled={!feedbackText.trim()}
                className="min-h-11 self-end rounded-2xl border border-[#d8caba] bg-white px-5 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff8eb] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {languageKey === "en" ? "Open email" : "פתח מייל לשליחה"}
              </button>
            </div>

            <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
              {languageKey === "en"
                ? "Your email app opens before sending. The recipient can be changed later with NEXT_PUBLIC_FEEDBACK_EMAIL."
                : "המייל ייפתח אצלכם לפני שליחה. אפשר להחליף את הנמען בעתיד דרך NEXT_PUBLIC_FEEDBACK_EMAIL."}
            </p>
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
