"use client";

import { useMemo, useState } from "react";
import {
  initialPermissionUsers,
  roleLabels,
} from "@/data/permissions";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { storageKeys } from "@/lib/storageKeys";
import type {
  FamilyPermissionUser,
  ModulePermission,
} from "@/types/permissions";

type PermissionKey = keyof Pick<
  ModulePermission,
  "view" | "create" | "edit" | "delete"
>;

const permissionLabels: Record<PermissionKey, string> = {
  view: "צפייה",
  create: "יצירה",
  edit: "עריכה",
  delete: "מחיקה",
};

export default function PermissionsManager() {
  const [users, setUsers] =
    usePersistentArrayState<FamilyPermissionUser>(
      storageKeys.permissions,
      initialPermissionUsers
    );
  const [selectedUserId, setSelectedUserId] = useState(initialPermissionUsers[0].id);
  const [inviteName, setInviteName] = useState("");

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? users[0] ?? null,
    [selectedUserId, users]
  );
  const selectedPermissions = selectedUser?.permissions ?? [];
  const cloudPermissionsEnabled = isFeatureEnabled("cloudPersistence");
  const permissionDisabledReason =
    "ניהול הרשאות אמיתי דורש חיבור ענן והרשאות שרת. כרגע זה מוצג כמודל תכנון בלבד.";
  const invitationDisabledReason =
    "הזמנות אמיתיות דורשות חיבור ענן, אימייל והרשאות שרת. האפשרות תיפתח אחרי חיבור התשתית המאובטחת.";

  const privateModules = selectedPermissions.filter(
    (permission) => permission.isPrivate
  );
  const sharedModules = selectedPermissions.filter(
    (permission) => !permission.isPrivate
  );

  function togglePermission(
    userId: string,
    moduleLabel: string,
    permissionKey: PermissionKey
  ) {
    if (!cloudPermissionsEnabled) {
      return;
    }

    if (!userId) {
      return;
    }

    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              permissions: user.permissions.map((permission) =>
                permission.label === moduleLabel
                  ? {
                      ...permission,
                      [permissionKey]: !permission[permissionKey],
                    }
                  : permission
              ),
            }
          : user
      )
    );
  }

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "משתמשים", value: users.length },
          { label: "אזורים פרטיים", value: privateModules.length },
          { label: "אזורים משותפים", value: sharedModules.length },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[18px] border border-white/80 bg-white/90 p-3 text-right shadow-[0_12px_30px_rgba(33,43,63,0.07)]"
          >
            <p className="truncate text-[11px] font-bold text-slate-500">
              {item.label}
            </p>
            <p className="mt-1 text-xl font-black text-slate-950">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-[24px] border border-white/80 bg-white/90 p-3 text-right shadow-[0_16px_40px_rgba(33,43,63,0.08)]">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <span className="w-fit rounded-full bg-[#fff8eb] px-3 py-1 text-xs font-black text-[#9a6b17]">
            ילדים לא רואים כספים ובריאות פרטיים בלי אישור מנהל
          </span>
          <div>
            <p className="mb-1 text-xs font-bold text-slate-500">
              שיתוף משפחתי
            </p>
            <h2 className="text-lg font-black text-slate-950">
              הרשאות לפי אדם ומודול
            </h2>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-2">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                className={
                  selectedUser?.id === user.id
                    ? "w-full rounded-2xl bg-[#111827] p-4 text-right text-white shadow-[0_14px_34px_rgba(17,24,39,0.16)]"
                    : "w-full rounded-2xl border border-[#ebe4d8] bg-[#fffdf8] p-4 text-right text-slate-800 transition hover:-translate-y-0.5 hover:bg-white"
                }
              >
                <span className="block text-base font-black">{user.name}</span>
                <span className="mt-1 block text-sm opacity-75">
                  {roleLabels[user.role]}
                </span>
              </button>
            ))}

            <div className="rounded-2xl border border-[#ebe4d8] bg-[#fffdf8] p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-black text-slate-600">
                  בקרוב
                </span>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-950">
                    הזמנת בן משפחה
                  </p>
                  <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                    {invitationDisabledReason}
                  </p>
                </div>
              </div>
              <input
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
                disabled
                aria-describedby="family-invite-disabled-reason"
                className="mb-3 w-full cursor-not-allowed rounded-xl border border-[#ebe4d8] bg-white/70 px-4 py-3 text-right text-slate-500 outline-none placeholder:text-slate-400"
                placeholder="שם להזמנה"
              />
              <p id="family-invite-disabled-reason" className="sr-only">
                {invitationDisabledReason}
              </p>
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-dashed border-[#d8cdbc] bg-white/70 px-4 py-3 text-sm font-black text-slate-400"
              >
                דורש חיבור ענן
              </button>
            </div>
          </aside>

          <div>
            <div className="mb-3 rounded-2xl border border-[#ebe4d8] bg-[#fffdf8] p-4">
              <p className="text-xs font-bold text-slate-500">משתמש נבחר</p>
              <h3 className="mt-1 text-xl font-black text-slate-950">
                {selectedUser?.name ?? "אין משתמש נבחר"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedUser?.note ?? "המרחב המשפחתי החדש מתחיל נקי."}
              </p>
            </div>

            {!cloudPermissionsEnabled && (
              <p className="mb-3 rounded-2xl border border-dashed border-[#d8cdbc] bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600">
                {permissionDisabledReason}
              </p>
            )}

            {selectedUser && selectedPermissions.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-[#ebe4d8] bg-white">
                <table className="w-full min-w-[760px] text-right text-sm">
                  <thead className="bg-[#fffdf8]">
                    <tr className="border-b border-[#ebe4d8] text-slate-600">
                      <th className="px-3 py-3">מודול</th>
                      <th className="px-3 py-3">אזור</th>
                      {Object.values(permissionLabels).map((label) => (
                        <th key={label} className="px-3 py-3">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPermissions.map((permission) => (
                      <tr
                        key={permission.label}
                        className="border-b border-[#ebe4d8] text-slate-700 last:border-b-0"
                      >
                        <td className="px-3 py-3 font-black text-slate-950">
                          {permission.label}
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {permission.isPrivate ? "פרטי" : "משותף"}
                          </span>
                        </td>
                        {(Object.keys(permissionLabels) as PermissionKey[]).map(
                          (permissionKey) => (
                            <td key={permissionKey} className="px-3 py-3">
                              <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-[#fffdf8] px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={permission[permissionKey]}
                                  disabled={!cloudPermissionsEnabled}
                                  onChange={() =>
                                    togglePermission(
                                      selectedUser.id,
                                      permission.label,
                                      permissionKey
                                    )
                                  }
                                  className="h-4 w-4 accent-[#111827] disabled:cursor-not-allowed disabled:opacity-40"
                                />
                                <span className="text-xs font-bold text-slate-600">
                                  {permission[permissionKey] ? "כן" : "לא"}
                                </span>
                              </label>
                            </td>
                          )
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#ebe4d8] bg-white p-5 text-center">
                <p className="text-base font-black text-slate-950">
                  עדיין אין בני משפחה לניהול הרשאות
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-600">
                  כשיצורף בן משפחה למרחב, ההרשאות שלו יופיעו כאן בצורה ברורה.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
