import { beforeEach, describe, expect, it } from "vitest";
import { storageKeys } from "@/lib/storageKeys";
import {
  createBackup,
  parseBackup,
  restoreBackup,
} from "@/lib/dataBackup";
import {
  clearActiveScopedStorageData,
  getScopedStorageKeyForScope,
  readStorageArray,
  setActiveStorageUserScope,
  writeStorage,
} from "@/utils/storage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("backup and restore", () => {
  it("includes all scoped family data, including formerly-unscoped keys (regression)", () => {
    setActiveStorageUserScope("family-a");
    writeStorage(storageKeys.finance, [{ id: "tx-1" }]);
    writeStorage(storageKeys.vehicleProfiles, [{ id: "car-1" }]);
    writeStorage(storageKeys.familyLegacyArchive, [{ id: "archive-1" }]);

    const backup = createBackup();
    const backedUpKeys = Object.keys(backup.entries);

    expect(backedUpKeys).toContain(
      getScopedStorageKeyForScope("family-a", storageKeys.finance)
    );
    expect(backedUpKeys).toContain(
      getScopedStorageKeyForScope("family-a", storageKeys.vehicleProfiles)
    );
    expect(backedUpKeys).toContain(
      getScopedStorageKeyForScope("family-a", storageKeys.familyLegacyArchive)
    );
  });

  it("never exports another family's data", () => {
    setActiveStorageUserScope("family-b");
    writeStorage(storageKeys.finance, [{ id: "other-family-tx" }]);
    setActiveStorageUserScope("family-a");
    writeStorage(storageKeys.finance, [{ id: "my-tx" }]);

    const backup = createBackup();
    const serialized = JSON.stringify(backup.entries);

    expect(serialized).toContain("my-tx");
    expect(serialized).not.toContain("other-family-tx");
  });

  it("round-trips: backup, wipe, restore restores the data", () => {
    setActiveStorageUserScope("family-a");
    writeStorage(storageKeys.vehicleProfiles, [{ id: "car-1" }]);
    writeStorage(storageKeys.tasks, [{ id: "task-1" }]);

    const backup = createBackup();
    clearActiveScopedStorageData();
    expect(readStorageArray(storageKeys.vehicleProfiles, [])).toEqual([]);

    const restoredCount = restoreBackup(backup);

    expect(restoredCount).toBeGreaterThanOrEqual(2);
    expect(readStorageArray(storageKeys.vehicleProfiles, [])).toEqual([
      { id: "car-1" },
    ]);
    expect(readStorageArray(storageKeys.tasks, [])).toEqual([{ id: "task-1" }]);
  });

  it("restores a backup taken under another scope into the active scope", () => {
    setActiveStorageUserScope("family-a");
    writeStorage(storageKeys.tasks, [{ id: "task-1" }]);
    const backup = createBackup();

    window.localStorage.clear();
    setActiveStorageUserScope("family-b");
    restoreBackup(backup);

    expect(readStorageArray(storageKeys.tasks, [])).toEqual([{ id: "task-1" }]);
  });

  it("maps legacy unscoped keys from old backups into the active scope", () => {
    // גיבויים מלפני תיקון הבידוד שמרו מפתחות כמו nestly-vehicle-profiles גלובלית.
    const legacyBackup = parseBackup(
      JSON.stringify({
        app: "nestly",
        version: 1,
        exportedAt: "2026-01-01T00:00:00.000Z",
        entries: {
          [storageKeys.vehicleProfiles]: JSON.stringify([{ id: "old-car" }]),
        },
      })
    );

    expect(legacyBackup).not.toBeNull();

    setActiveStorageUserScope("family-a");
    restoreBackup(legacyBackup as NonNullable<typeof legacyBackup>);

    expect(readStorageArray(storageKeys.vehicleProfiles, [])).toEqual([
      { id: "old-car" },
    ]);
    expect(window.localStorage.getItem(storageKeys.vehicleProfiles)).toBeNull();
  });

  it("rejects malformed backup payloads", () => {
    expect(parseBackup("not-json")).toBeNull();
    expect(parseBackup(JSON.stringify({ app: "other", version: 1 }))).toBeNull();
    expect(
      parseBackup(JSON.stringify({ app: "nestly", version: 99, entries: {} }))
    ).toBeNull();
  });
});
