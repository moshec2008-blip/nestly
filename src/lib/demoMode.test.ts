import { beforeEach, describe, expect, it } from "vitest";
import { storageKeys } from "@/lib/storageKeys";
import { enterDemoMode, exitDemoMode, isDemoModeActive } from "@/lib/demoMode";
import {
  demoStorageScope,
  getActiveStorageUserScope,
  getScopedStorageKeyForScope,
  readStorageArray,
  setActiveStorageUserScope,
  writeStorage,
} from "@/utils/storage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("demo mode isolation", () => {
  it("switches to the demo scope and back without touching family data", () => {
    setActiveStorageUserScope("family-a");
    writeStorage(storageKeys.finance, [{ id: "real-transaction" }]);

    enterDemoMode();
    expect(isDemoModeActive()).toBe(true);
    writeStorage(storageKeys.finance, [{ id: "demo-transaction" }]);

    exitDemoMode();
    expect(getActiveStorageUserScope()).toBe("family-a");
    expect(readStorageArray(storageKeys.finance, [])).toEqual([
      { id: "real-transaction" },
    ]);
  });

  it("starts demo clean: previous demo leftovers are wiped on entry", () => {
    setActiveStorageUserScope("family-a");
    const demoKey = getScopedStorageKeyForScope(
      demoStorageScope,
      storageKeys.finance
    ) as string;
    window.localStorage.setItem(
      demoKey,
      JSON.stringify([{ id: "old-demo-leftover" }])
    );

    enterDemoMode();

    expect(window.localStorage.getItem(demoKey)).toBeNull();
  });

  it("wipes demo leftovers for previously-unscoped keys too (regression)", () => {
    // רגרסיה לבאג ששת המפתחות: גם vehicleProfiles חייב להתנקות בכניסה לדמו.
    setActiveStorageUserScope("family-a");
    const demoVehiclesKey = getScopedStorageKeyForScope(
      demoStorageScope,
      storageKeys.vehicleProfiles
    ) as string;
    window.localStorage.setItem(
      demoVehiclesKey,
      JSON.stringify([{ id: "old-demo-car" }])
    );

    enterDemoMode();

    expect(window.localStorage.getItem(demoVehiclesKey)).toBeNull();
  });
});
