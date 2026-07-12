// גיבוי ושחזור מלא של כל נתוני האפליקציה השמורים ב-localStorage.
// כל מפתחות האפליקציה מתחילים באחת מהקידומות האלה.
const backupKeyPrefixes = ["nestly", "beit-cohen-shor"] as const;

export type NestlyBackup = {
  app: "nestly";
  version: 1;
  exportedAt: string;
  entries: Record<string, string>;
};

function isAppStorageKey(key: string) {
  return backupKeyPrefixes.some((prefix) => key.startsWith(prefix));
}

export function createBackup(): NestlyBackup {
  const entries: Record<string, string> = {};

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key || !isAppStorageKey(key)) {
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
    entries,
  };
}

// משחזר את כל הרשומות מהגיבוי (דורס מפתחות קיימים, שומר מפתחות שאינם בגיבוי).
// מחזיר את מספר הרשומות ששוחזרו, או null אם השחזור נכשל באמצע.
export function restoreBackup(backup: NestlyBackup): number | null {
  let restoredCount = 0;

  try {
    for (const [key, value] of Object.entries(backup.entries)) {
      window.localStorage.setItem(key, value);
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
