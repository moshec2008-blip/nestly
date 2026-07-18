import {
  getActiveStorageUserScope,
  getScopedStorageKeyForScope,
  isUserScopedStorageKey,
} from "@/utils/storage";

// גיבוי ושחזור של נתוני Nestly במרחב הפעיל בלבד.
// חשוב לבטא: לא מייצאים נתונים של מרחבים או משתמשים אחרים מאותו דפדפן.
const backupKeyPrefixes = ["nestly", "beit-cohen-shor"] as const;

export type NestlyBackup = {
  app: "nestly";
  version: 1;
  exportedAt: string;
  scope?: string;
  entries: Record<string, string>;
};

function isAppStorageKey(key: string) {
  return backupKeyPrefixes.some((prefix) => key.startsWith(prefix));
}

function isScopedStorageKey(key: string) {
  return /^nestly:[^:]+:/.test(key);
}

function getScopedKeyParts(key: string) {
  const match = key.match(/^nestly:([^:]+):(.+)$/);

  if (!match) {
    return null;
  }

  return {
    scope: match[1],
    baseKey: match[2],
  };
}

function shouldExportKey(key: string, activeScope: string | null) {
  if (!isAppStorageKey(key) || key.endsWith(":corrupt-backup")) {
    return false;
  }

  if (!activeScope) {
    return !isScopedStorageKey(key) && !key.startsWith("nestly:account:");
  }

  return key.startsWith(`nestly:${activeScope}:`);
}

function getRestoreKey(key: string, activeScope: string | null) {
  if (!activeScope) {
    return key;
  }

  const scopedParts = getScopedKeyParts(key);

  if (!scopedParts) {
    // גיבויים ישנים שמרו מפתחות תלויי-מרחב בצורה גלובלית (לפני תיקון הבידוד) —
    // ממפים אותם אל המרחב הפעיל כדי שהנתונים יופיעו מיד אחרי השחזור.
    if (isUserScopedStorageKey(key)) {
      return getScopedStorageKeyForScope(activeScope, key) ?? key;
    }

    return key;
  }

  if (!isUserScopedStorageKey(scopedParts.baseKey)) {
    return null;
  }

  return getScopedStorageKeyForScope(activeScope, scopedParts.baseKey) ?? key;
}

export function createBackup(): NestlyBackup {
  const entries: Record<string, string> = {};
  const activeScope = getActiveStorageUserScope();

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key || !shouldExportKey(key, activeScope)) {
      continue;
    }

    const value = window.localStorage.getItem(key);

    if (value !== null) {
      entries[key] = value;
    }
  }

  return {
    app: "nestly",
    version: 1,
    exportedAt: new Date().toISOString(),
    scope: activeScope ?? undefined,
    entries,
  };
}

export function getBackupFileName() {
  const today = new Intl.DateTimeFormat("en-CA").format(new Date());
  return `nestly-backup-${today}.json`;
}

export function parseBackup(rawContent: string): NestlyBackup | null {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(rawContent);
  } catch {
    return null;
  }

  if (!parsedValue || typeof parsedValue !== "object") {
    return null;
  }

  const backup = parsedValue as Partial<NestlyBackup>;

  if (
    backup.app !== "nestly" ||
    backup.version !== 1 ||
    !backup.entries ||
    typeof backup.entries !== "object" ||
    Array.isArray(backup.entries)
  ) {
    return null;
  }

  const entries: Record<string, string> = {};

  for (const [key, value] of Object.entries(backup.entries)) {
    if (isAppStorageKey(key) && typeof value === "string") {
      entries[key] = value;
    }
  }

  return {
    app: "nestly",
    version: 1,
    exportedAt:
      typeof backup.exportedAt === "string" ? backup.exportedAt : "",
    scope: typeof backup.scope === "string" ? backup.scope : undefined,
    entries,
  };
}

// משחזר את הרשומות מהגיבוי אל המרחב הפעיל.
// אם הגיבוי נוצר תחת scope אחר, המפתחות מותאמים למרחב הפעיל כדי לא לדרוס משפחה אחרת.
export function restoreBackup(backup: NestlyBackup): number | null {
  let restoredCount = 0;
  const activeScope = getActiveStorageUserScope();

  try {
    for (const [key, value] of Object.entries(backup.entries)) {
      const restoreKey = getRestoreKey(key, activeScope);

      if (!restoreKey) {
        continue;
      }

      window.localStorage.setItem(restoreKey, value);
      restoredCount += 1;
    }
  } catch {
    return null;
  }

  return restoredCount;
}

export function countBackupDataEntries(backup: NestlyBackup) {
  return Object.keys(backup.entries).length;
}
