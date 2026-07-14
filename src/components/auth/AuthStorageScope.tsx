"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { isDemoModeActive } from "@/lib/demoMode";
import {
  ensureDefaultFamilySpace,
} from "@/lib/familySpace";
import { storageKeys } from "@/lib/storageKeys";
import { localCloudRepository } from "@/lib/cloud";
import { trackTelemetryEvent } from "@/services/telemetry";
import {
  getScopedStorageKeyForScope,
  getStorageScopeEventName,
  guestStorageScope,
  setActiveStorageUserScope,
} from "@/utils/storage";

const migratableStorageKeys = [
  storageKeys.shopping,
  storageKeys.tasks,
  storageKeys.finance,
  storageKeys.family,
] as const;

type MigrationState = {
  targetScope: string;
};

function readArrayFromLocalStorage(key: string) {
  const rawValue = window.localStorage.getItem(key);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function getRecordKey(value: unknown) {
  if (!value || typeof value !== "object") {
    return JSON.stringify(value);
  }

  const record = value as { id?: unknown; title?: unknown; name?: unknown };
  return String(record.id ?? record.title ?? record.name ?? JSON.stringify(value));
}

function mergeRecords(currentItems: unknown[], guestItems: unknown[]) {
  const seen = new Set(currentItems.map(getRecordKey));
  const mergedItems = [...currentItems];

  guestItems.forEach((item) => {
    const key = getRecordKey(item);

    if (!seen.has(key)) {
      seen.add(key);
      mergedItems.push(item);
    }
  });

  return mergedItems;
}

export default function AuthStorageScope() {
  const { data: session, status } = useSession();
  const userEmail = session?.user?.email;
  const userName = session?.user?.name;
  const userImage = session?.user?.image;
  const accountKey =
    userEmail || session?.user?.id || userName || "";
  const [migrationState, setMigrationState] = useState<MigrationState | null>(null);

  useEffect(() => {
    if (status === "authenticated" && accountKey) {
      void localCloudRepository.bootstrapIdentity({
        userId: accountKey,
        email: userEmail || accountKey,
        name: userName,
        image: userImage,
      });

      const familySpace = ensureDefaultFamilySpace(
        accountKey,
        userName
      );

      setActiveStorageUserScope(familySpace?.id ?? accountKey);
      const targetScope = familySpace?.id ?? accountKey;
      const hasGuestData = migratableStorageKeys.some((storageKey) => {
        const guestKey = getScopedStorageKeyForScope(guestStorageScope, storageKey);

        return Boolean(guestKey && window.localStorage.getItem(guestKey));
      });

      if (!hasGuestData) {
        return;
      }

      const timeoutId = window.setTimeout(
        () => setMigrationState({ targetScope }),
        0
      );

      return () => window.clearTimeout(timeoutId);
    }

    if (status === "unauthenticated" && !isDemoModeActive()) {
      setActiveStorageUserScope(guestStorageScope);
    }
  }, [accountKey, status, userEmail, userImage, userName]);

  function migrateGuestData() {
    if (!migrationState) {
      return;
    }

    migratableStorageKeys.forEach((storageKey) => {
      const guestKey = getScopedStorageKeyForScope(guestStorageScope, storageKey);
      const targetKey = getScopedStorageKeyForScope(
        migrationState.targetScope,
        storageKey
      );

      if (!guestKey || !targetKey) {
        return;
      }

      const guestItems = readArrayFromLocalStorage(guestKey);

      if (guestItems.length === 0) {
        return;
      }

      const currentItems = readArrayFromLocalStorage(targetKey);
      window.localStorage.setItem(
        targetKey,
        JSON.stringify(mergeRecords(currentItems, guestItems))
      );
    });

    setMigrationState(null);
    window.dispatchEvent(new CustomEvent(getStorageScopeEventName()));
    trackTelemetryEvent({
      name: "migration_completed",
      module: "auth",
      properties: { migratedKeys: migratableStorageKeys.length },
    });
  }

  return migrationState ? (
    <div
      className="fixed inset-0 z-[91] flex items-end justify-center bg-slate-950/35 px-3 pb-3 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="migration-title"
    >
      <div className="w-full max-w-md rounded-[26px] bg-white p-4 text-right shadow-[0_28px_90px_rgba(15,23,42,0.24)] ring-1 ring-[#eadfcd]">
        <p className="text-xs font-black text-[#9a6b17]">מצב בסיסי</p>
        <h2 id="migration-title" className="mt-1 text-xl font-black text-[#111827]">
          מצאנו נתונים שיצרת במצב בסיסי.
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          להעביר אותם למרחב המשפחתי שלך? הפעולה שומרת נתונים קיימים ומנסה
          להימנע מכפילויות.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={migrateGuestData}
            className="min-h-11 rounded-2xl bg-[#111827] px-4 text-sm font-black text-white"
          >
            כן
          </button>
          <button
            type="button"
            onClick={() => setMigrationState(null)}
            className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-white px-4 text-sm font-black text-slate-700"
          >
            לא עכשיו
          </button>
        </div>
      </div>
    </div>
  ) : null;
}
