import { beforeEach, describe, expect, it } from "vitest";
import { storageKeys } from "@/lib/storageKeys";
import {
  demoStorageScope,
  getScopedStorageKeyForScope,
  isUserScopedStorageKey,
  migrateLegacyUnscopedStorageData,
  readStorageArray,
  setActiveStorageUserScope,
  writeStorage,
} from "@/utils/storage";

// מפתחות שמכוונים להיות גלובליים למכשיר (לא נתוני משפחה):
const deviceGlobalKeys = new Set<string>([
  storageKeys.authSession,
  storageKeys.firstRunWelcome,
  storageKeys.smartNudge,
]);

beforeEach(() => {
  window.localStorage.clear();
});

describe("family-space isolation invariant", () => {
  // הבדיקה הזו הייתה תופסת את באג ששת המפתחות הלא-ממודרים ביום שנוצר:
  // כל מפתח ב-storageKeys שמחזיק נתוני משפחה חייב להיות ברשימת המידור.
  it("every family-data key in storageKeys is user-scoped", () => {
    for (const key of Object.values(storageKeys)) {
      if (deviceGlobalKeys.has(key)) {
        continue;
      }

      expect(isUserScopedStorageKey(key), `key "${key}" must be user-scoped`).toBe(
        true
      );
    }
  });

  it("scoped keys get a scope prefix, device keys stay unchanged", () => {
    expect(getScopedStorageKeyForScope("family-a", storageKeys.vehicleProfiles)).toBe(
      `nestly:family-a:${storageKeys.vehicleProfiles}`
    );
    expect(getScopedStorageKeyForScope("family-a", storageKeys.authSession)).toBe(
      storageKeys.authSession
    );
  });

  it("two scopes never share the same storage entry", () => {
    setActiveStorageUserScope("family-a");
    writeStorage(storageKeys.familyLegacyCollections, [{ id: "a-item" }]);

    setActiveStorageUserScope("family-b");
    const familyBItems = readStorageArray(storageKeys.familyLegacyCollections, []);

    expect(familyBItems).toEqual([]);
  });
});

describe("readStorageArray", () => {
  it("filters out items that fail the validator without dropping valid ones", () => {
    setActiveStorageUserScope("family-a");
    const scopedKey = getScopedStorageKeyForScope(
      "family-a",
      storageKeys.tasks
    ) as string;
    window.localStorage.setItem(
      scopedKey,
      JSON.stringify([{ id: "ok" }, "corrupt", { id: "ok-2" }])
    );

    const items = readStorageArray<{ id: string }>(
      storageKeys.tasks,
      [],
      (value): value is { id: string } =>
        Boolean(value && typeof value === "object" && "id" in value)
    );

    expect(items).toEqual([{ id: "ok" }, { id: "ok-2" }]);
  });

  it("backs up corrupt JSON instead of losing it silently", () => {
    setActiveStorageUserScope("family-a");
    const scopedKey = getScopedStorageKeyForScope(
      "family-a",
      storageKeys.tasks
    ) as string;
    window.localStorage.setItem(scopedKey, "{not-json");

    const items = readStorageArray(storageKeys.tasks, []);

    expect(items).toEqual([]);
    expect(window.localStorage.getItem(`${scopedKey}:corrupt-backup`)).toBe(
      "{not-json"
    );
  });
});

describe("migrateLegacyUnscopedStorageData", () => {
  it("moves legacy global data into the active scope and removes the global key", () => {
    window.localStorage.setItem(
      storageKeys.vehicleProfiles,
      JSON.stringify([{ id: "car-1" }])
    );
    setActiveStorageUserScope("family-a");

    const migratedCount = migrateLegacyUnscopedStorageData();

    expect(migratedCount).toBe(1);
    expect(window.localStorage.getItem(storageKeys.vehicleProfiles)).toBeNull();
    expect(readStorageArray(storageKeys.vehicleProfiles, [])).toEqual([
      { id: "car-1" },
    ]);
  });

  it("never migrates into the demo scope", () => {
    window.localStorage.setItem(
      storageKeys.vehicleProfiles,
      JSON.stringify([{ id: "car-1" }])
    );
    setActiveStorageUserScope(demoStorageScope);

    const migratedCount = migrateLegacyUnscopedStorageData();

    expect(migratedCount).toBe(0);
    expect(window.localStorage.getItem(storageKeys.vehicleProfiles)).not.toBeNull();
  });

  it("does not overwrite data the scope already has", () => {
    setActiveStorageUserScope("family-a");
    writeStorage(storageKeys.vehicleProfiles, [{ id: "existing" }]);
    window.localStorage.setItem(
      storageKeys.vehicleProfiles,
      JSON.stringify([{ id: "legacy" }])
    );

    migrateLegacyUnscopedStorageData();

    expect(readStorageArray(storageKeys.vehicleProfiles, [])).toEqual([
      { id: "existing" },
    ]);
    expect(window.localStorage.getItem(storageKeys.vehicleProfiles)).toBeNull();
  });
});
