export type StorageValidator<T> = (value: unknown) => value is T;

const activeStorageUserScopeKey = "nestly-active-user-scope";
const storageScopeEventName = "nestly-storage-scope-change";
const storageWriteErrorEventName = "nestly-storage-write-error";
const corruptBackupKeySuffix = ":corrupt-backup";
export const guestStorageScope = "guest-device";
export const demoStorageScope = "demo-family-space";

const userScopedStorageKeys = new Set([
  "beit-cohen-shor-app-settings",
  "beit-cohen-shor-family-tasks",
  "beit-cohen-shor-finance-transactions",
  "beit-cohen-shor-finance-bank-balance",
  "beit-cohen-shor-finance-savings-balance",
  "beit-cohen-shor-finance-loans-balance",
  "beit-cohen-shor-finance-mortgage-balance",
  "beit-cohen-shor-health-records",
  "beit-cohen-shor-documents",
  "beit-cohen-shor-receipt-documents",
  "beit-cohen-shor-vehicle-records",
  "nestly-vehicle-profiles",
  "nestly-vehicle-driver-licenses",
  "nestly-vehicle-fines",
  "beit-cohen-shor-family-records",
  "nestly-family-tree",
  "beit-cohen-shor-birthdays",
  "beit-cohen-shor-shopping-items",
  "beit-cohen-shor-permissions",
  "nestly-smart-captures",
  "nestly-family-knowledge",
  "nestly-family-knowledge-revisions",
  "nestly-family-legacy-collections",
  "nestly-family-legacy-archive",
  "nestly-family-timeline",
  "nestly-life-events",
  "nestly-universal-inbox",
  "nestly-entity-relations",
  "nestly-ai-suggestions",
  "nestly-ai-audit",
  "nestly-ai-suggestion-feedback",
  "nestly-command-center-preferences",
  "nestly-home-attention-preferences",
  "nestly-automations",
  "nestly-automation-history",
  "nestly-automation-review-queue",
  "nestly-smart-templates",
  "nestly-smart-collections",
  "nestly-personalization-preferences",
  "nestly-import-jobs",
  "nestly-export-jobs",
]);

function normalizeStorageScope(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_");
}

export function getScopedStorageKeyForScope(scopeValue: string, key: string) {
  if (!userScopedStorageKeys.has(key)) {
    return key;
  }

  const scope = normalizeStorageScope(scopeValue);

  return scope ? `nestly:${scope}:${key}` : null;
}

export function getActiveStorageUserScope() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(activeStorageUserScopeKey);
}

export function getStorageScopeEventName() {
  return storageScopeEventName;
}

export function setActiveStorageUserScope(value: string) {
  if (typeof window === "undefined") {
    return;
  }

  const scope = normalizeStorageScope(value);
  const currentScope = getActiveStorageUserScope();

  if (!scope || currentScope === scope) {
    return;
  }

  window.localStorage.setItem(activeStorageUserScopeKey, scope);
  window.dispatchEvent(new CustomEvent(storageScopeEventName));
}

export function clearActiveStorageUserScope() {
  if (typeof window === "undefined") {
    return;
  }

  if (!getActiveStorageUserScope()) {
    return;
  }

  window.localStorage.removeItem(activeStorageUserScopeKey);
  window.dispatchEvent(new CustomEvent(storageScopeEventName));
}

export function getScopedStorageKey(key: string) {
  if (!userScopedStorageKeys.has(key)) {
    return key;
  }

  const scope = getActiveStorageUserScope();

  if (!scope) {
    return null;
  }

  return getScopedStorageKeyForScope(scope, key);
}

export function isUserScopedStorageKey(key: string) {
  return userScopedStorageKeys.has(key);
}

export function clearActiveScopedStorageData() {
  if (typeof window === "undefined") {
    return 0;
  }

  const scope = getActiveStorageUserScope();

  if (!scope) {
    return 0;
  }

  let removedCount = 0;

  userScopedStorageKeys.forEach((key) => {
    if (key === "beit-cohen-shor-app-settings") {
      return;
    }

    const scopedKey = getScopedStorageKeyForScope(scope, key);

    if (scopedKey && window.localStorage.getItem(scopedKey) !== null) {
      window.localStorage.removeItem(scopedKey);
      removedCount += 1;
    }
  });

  if (removedCount > 0) {
    window.dispatchEvent(new CustomEvent(storageScopeEventName));
  }

  return removedCount;
}

// מפתחות שנשמרו בעבר בלי בידוד מרחב (באג היסטורי): הנתונים שלהם ישבו במפתח
// גלובלי אחד משותף לכל המרחבים באותו דפדפן. המפתחות נוספו מאז ל-userScopedStorageKeys,
// והפונקציה הזו מעבירה חד-פעמית נתונים קיימים מהמפתח הגלובלי אל המרחב הפעיל.
const legacyUnscopedStorageKeys = [
  "nestly-vehicle-profiles",
  "nestly-vehicle-driver-licenses",
  "nestly-vehicle-fines",
  "nestly-family-knowledge-revisions",
  "nestly-family-legacy-collections",
  "nestly-family-legacy-archive",
] as const;

// המרחב הפעיל הראשון (אורח או משפחה, לא דמו) מאמץ את הנתונים הגלובליים הישנים.
// המפתח הגלובלי נמחק רק אחרי העתקה מוצלחת, כדי שדמו ומרחבים אחרים לא ידלפו אליו.
export function migrateLegacyUnscopedStorageData() {
  if (typeof window === "undefined") {
    return 0;
  }

  const scope = getActiveStorageUserScope();

  if (!scope || scope === demoStorageScope) {
    return 0;
  }

  let migratedCount = 0;

  for (const key of legacyUnscopedStorageKeys) {
    const legacyValue = window.localStorage.getItem(key);

    if (legacyValue === null) {
      continue;
    }

    const scopedKey = getScopedStorageKeyForScope(scope, key);

    if (!scopedKey || scopedKey === key) {
      continue;
    }

    try {
      if (window.localStorage.getItem(scopedKey) === null) {
        window.localStorage.setItem(scopedKey, legacyValue);
        migratedCount += 1;
      }

      window.localStorage.removeItem(key);
    } catch {
      // אין מקום — משאירים את המפתח הגלובלי כדי לא לאבד נתונים.
    }
  }

  if (migratedCount > 0) {
    window.dispatchEvent(new CustomEvent(storageScopeEventName));
  }

  return migratedCount;
}

export function hasStoredValue(key: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const scopedKey = getScopedStorageKey(key);
  return Boolean(scopedKey && window.localStorage.getItem(scopedKey));
}

function parseStorageValue(value: string): unknown {
  return JSON.parse(value);
}

export function getStorageWriteErrorEventName() {
  return storageWriteErrorEventName;
}

// שומר עותק של ערך פגום לפני שהוא נדרס, כדי שנתונים לא יאבדו לצמיתות.
function backupCorruptValue(scopedKey: string, rawValue: string) {
  try {
    window.localStorage.setItem(scopedKey + corruptBackupKeySuffix, rawValue);
  } catch {
    // אין מקום לגיבוי — עדיף להמשיך מאשר לקרוס.
  }
}

export function readStorage<T>(
  key: string,
  fallback: T,
  validator?: StorageValidator<T>
): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const scopedKey = getScopedStorageKey(key);

  if (!scopedKey) {
    return fallback;
  }

  const value = window.localStorage.getItem(scopedKey);

  if (!value) {
    return fallback;
  }

  try {
    const parsedValue = parseStorageValue(value);

    if (validator && !validator(parsedValue)) {
      backupCorruptValue(scopedKey, value);
      return fallback;
    }

    return parsedValue as T;
  } catch {
    backupCorruptValue(scopedKey, value);
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const scopedKey = getScopedStorageKey(key);

    if (!scopedKey) {
      return false;
    }

    window.localStorage.setItem(scopedKey, JSON.stringify(value));
    return true;
  } catch {
    window.dispatchEvent(
      new CustomEvent(storageWriteErrorEventName, { detail: { key } })
    );
    return false;
  }
}

export function readStorageArray<T>(
  key: string,
  fallback: T[],
  itemValidator?: StorageValidator<T>
): T[] {
  if (isUserScopedStorageKey(key) && !hasStoredValue(key)) {
    const activeScope = getActiveStorageUserScope();
    return activeScope === demoStorageScope || activeScope === guestStorageScope
      ? fallback
      : [];
  }

  const value = readStorage<unknown[]>(
    key,
    fallback,
    (candidate): candidate is unknown[] => Array.isArray(candidate)
  );

  if (!Array.isArray(value)) {
    return fallback;
  }

  if (!itemValidator) {
    return value as T[];
  }

  // פריט פגום לא מוחק את כל הרשימה — שומרים את מה שתקין.
  return value.filter(itemValidator);
}
