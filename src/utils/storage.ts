export type StorageValidator<T> = (value: unknown) => value is T;

const activeStorageUserScopeKey = "nestly-active-user-scope";
const storageScopeEventName = "nestly-storage-scope-change";
export const guestStorageScope = "guest-device";
export const demoStorageScope = "demo-family-space";

const userScopedStorageKeys = new Set([
  "beit-cohen-shor-app-settings",
  "beit-cohen-shor-family-tasks",
  "beit-cohen-shor-finance-transactions",
  "beit-cohen-shor-health-records",
  "beit-cohen-shor-documents",
  "beit-cohen-shor-vehicle-records",
  "beit-cohen-shor-family-records",
  "nestly-family-tree",
  "beit-cohen-shor-birthdays",
  "beit-cohen-shor-shopping-items",
  "beit-cohen-shor-permissions",
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
      return fallback;
    }

    return parsedValue as T;
  } catch {
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

  const value = readStorage<unknown>(key, fallback);

  if (!Array.isArray(value)) {
    return fallback;
  }

  if (!itemValidator) {
    return value as T[];
  }

  const validItems = value.filter(itemValidator);

  return validItems.length === value.length ? validItems : fallback;
}
