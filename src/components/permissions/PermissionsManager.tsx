"use client";

import { useMemo, useState } from "react";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import {
  initialPermissionUsers,
  roleLabels,
} from "@/data/permissions";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
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
  const { toast } = useFeedback();
  const [users, setUsers] =
    usePersistentArrayState<FamilyPermissionUser>(
      storageKeys.permissions,
      initialPermissionUsers
    );
  const [selectedUserId, setSelectedUserId] = useState(initialPermissionUsers[0].id);
  const [inviteName, setInviteName] = useState("");

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? users[0],
    [selectedUserId, users]
  );

  const privateModules = selectedUser.permissions.filter(
    (permission) => permission.isPrivate
  );
  const sharedModules = selectedUser.permissions.filter(
    (permission) => !permission.isPrivate
  );

  function togglePermission(
    userId: string,
    moduleLabel: string,
    permissionKey: PermissionKey
  ) {
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

  function invitePlaceholder() {
    const cleanName = inviteName.trim();

    if (!cleanName) {
      return;
    }

    toast({
      title: "הזמנה מוכנה",
      description: `הזמנה עבור ${cleanName} מוכנה לשלב הבא. בהמשך נחבר שליחה אמיתית.`,
      tone: "info",
    });
    setInviteName("");
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
                  selectedUser.id === user.id
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
              <p className="mb-2 text-sm font-black text-slate-950">
                הזמנת בן משפחה
              </p>
              <input
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
                className="mb-3 w-full rounded-xl border border-[#ebe4d8] bg-white px-4 py-3 text-right text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="שם להזמנה"
              />
              <button
                type="button"
                onClick={invitePlaceholder}
                className="w-full rounded-xl bg-[#111827] px-4 py-3 text-sm font-black text-white transition hover:bg-[#1f2937]"
              >
                הכנת הזמנה
              </button>
            </div>
          </aside>

          <div>
            <div className="mb-3 rounded-2xl border border-[#ebe4d8] bg-[#fffdf8] p-4">
              <p className="text-xs font-bold text-slate-500">משתמש נבחר</p>
              <h3 className="mt-1 text-xl font-black text-slate-950">
                {selectedUser.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedUser.note}
              </p>
            </div>

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
                  {selectedUser.permissions.map((permission) => (
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
                            <label className="inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-full bg-[#fffdf8] px-3 py-1">
                              <input
                                type="checkbox"
                                checked={permission[permissionKey]}
                                onChange={() =>
                                  togglePermission(
                                    selectedUser.id,
                                    permission.label,
                                    permissionKey
                                  )
                                }
                                className="h-4 w-4 accent-[#111827]"
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
          </div>
        </div>
      </section>
    </section>
  );
}
