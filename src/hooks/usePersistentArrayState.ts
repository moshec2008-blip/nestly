"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  readStorageArray,
  writeStorage,
  type StorageValidator,
} from "@/utils/storage";

type PersistentArrayState<T> = readonly [
  T[],
  Dispatch<SetStateAction<T[]>>
];

export function usePersistentArrayState<T>(
  storageKey: string,
  initialValue: T[],
  itemValidator?: StorageValidator<T>
): PersistentArrayState<T> {
  const [items, setItems] = useState<T[]>(initialValue);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setItems(readStorageArray(storageKey, initialValue, itemValidator));
      setHasLoadedStorage(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialValue, itemValidator, storageKey]);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    writeStorage(storageKey, items);
  }, [hasLoadedStorage, items, storageKey]);

  return [items, setItems] as const;
}
