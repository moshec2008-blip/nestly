"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { isDemoModeActive } from "@/lib/demoMode";
import {
  ensureDefaultFamilySpace,
} from "@/lib/familySpace";
import { storageKeys } from "@/lib/storageKeys";
import {
  ensureUserProfile,
  updateUserDisplayName,
} from "@/lib/userProfile";
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
  storageKeys.timeline,
] as const;

type MigrationState = {
  targetScope: string;
};

type ProfilePromptState = {
  accountKey: string;
  displayName: string;
  migrationTargetScope?: string;
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
  const [profilePrompt, setProfilePrompt] =
    useState<ProfilePromptState | null>(null);

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
      const userProfile = ensureUserProfile({
        accountKey,
        name: userName,
        email: userEmail,
        image: userImage,
      });

      setActiveStorageUserScope(familySpace?.id ?? accountKey);
      const targetScope = familySpace?.id ?? accountKey;
      const hasGuestData = migratableStorageKeys.some((storageKey) => {
        const guestKey = getScopedStorageKeyForScope(guestStorageScope, storageKey);

        return Boolean(guestKey && window.localStorage.getItem(guestKey));
      });

      if (userProfile && !userProfile.hasChosenDisplayName) {
        const timeoutId = window.setTimeout(
          () =>
            setProfilePrompt({
              accountKey,
              displayName: userProfile.displayName,
              migrationTargetScope: hasGuestData ? targetScope : undefined,
            }),
          0
        );

        return () => window.clearTimeout(timeoutId);
      }

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

  function saveDisplayName() {
    if (!profilePrompt) {
      return;
    }

    updateUserDisplayName(profilePrompt.accountKey, profilePrompt.displayName);
    if (profilePrompt.migrationTargetScope) {
      setMigrationState({ targetScope: profilePrompt.migrationTargetScope });
    }
    setProfilePrompt(null);
    trackTelemetryEvent({
      name: "profile_updated",
      module: "auth",
      properties: { source: "first_login_prompt" },
    });
  }

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

  if (profilePrompt) {
    return (
      <div
        className="fixed inset-0 z-[91] flex items-end justify-center bg-slate-950/35 px-3 pb-3 backdrop-blur-[2px] sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
      >
        <div className="w-full max-w-md rounded-[26px] bg-white p-4 text-right shadow-[0_28px_90px_rgba(15,23,42,0.24)] ring-1 ring-[#eadfcd]">
          <p className="text-xs font-black text-[#9a6b17]">
            ברוכים הבאים ל-Nestly
          </p>
          <h2 id="profile-title" className="mt-1 text-xl font-black text-[#111827]">
            איך לקרוא לך באפליקציה?
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            זה השם שיופיע בניווט, באבטחה ובהמשך בפעולות משפחתיות. אפשר לשנות אותו בכל רגע.
          </p>
          <label className="mt-4 block text-sm font-black text-slate-700">
            שם תצוגה
            <input
              value={profilePrompt.displayName}
              onChange={(event) =>
                setProfilePrompt((currentValue) =>
                  currentValue
                    ? { ...currentValue, displayName: event.target.value }
                    : currentValue
                )
              }
              className="mt-2 min-h-12 w-full rounded-2xl border border-[#e6e8ec] bg-white px-4 text-right text-base font-black text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#d8b470] focus:ring-4 focus:ring-[#d8b470]/15"
              placeholder="לדוגמה: משה"
              autoFocus
            />
          </label>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={saveDisplayName}
              className="min-h-11 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-4 text-sm font-black text-[#111827] shadow-[0_8px_18px_rgba(33,43,63,0.06)] transition hover:bg-white"
            >
              שמירה והמשך
            </button>
            <button
              type="button"
              onClick={() => {
                if (profilePrompt.migrationTargetScope) {
                  setMigrationState({
                    targetScope: profilePrompt.migrationTargetScope,
                  });
                }
                setProfilePrompt(null);
              }}
              className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-[#fafafb]"
            >
              אחר כך
            </button>
          </div>
        </div>
      </div>
    );
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
