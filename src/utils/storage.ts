export type StorageValidator<T> = (value: unknown) => value is T;

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

  const value = window.localStorage.getItem(key);

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
    window.localStorage.setItem(key, JSON.stringify(value));
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
