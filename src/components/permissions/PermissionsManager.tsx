"use client";

import { useMemo, useState } from "react";
import {
  initialPermissionUsers,
  roleLabels,
} from "@/data/permissions";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import type {
  FamilyPermissionUser,
  ModulePermission,
} from "@/types/permissions";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { storageKeys } from "@/lib/storageKeys";

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
      description: `הזמנה עבור ${cleanName} מוכנה לשלב הבא. בשלב עתידי נחבר שליחת הזמנה אמיתית.`,
      tone: "info",
    });
    setInviteName("");
  }

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-[18px] bg-slate-800/62 p-3 text-right shadow-[0_10px_30px_rgba(2,6,23,0.16)]">
          <p className="truncate text-[11px] text-slate-300">משתמשים</p>
          <p className="mt-1 text-xl font-black">{users.length}</p>
        </div>
        <div className="rounded-[18px] bg-slate-800/62 p-3 text-right shadow-[0_10px_30px_rgba(2,6,23,0.16)]">
          <p className="truncate text-[11px] text-slate-300">פרטיים</p>
          <p className="mt-1 text-xl font-black">{privateModules.length}</p>
        </div>
        <div className="rounded-[18px] bg-slate-800/62 p-3 text-right shadow-[0_10px_30px_rgba(2,6,23,0.16)]">
          <p className="truncate text-[11px] text-slate-300">משותפים</p>
          <p className="mt-1 text-xl font-black">{sharedModules.length}</p>
        </div>
      </div>

      <section className="rounded-[22px] bg-slate-800/58 p-3 text-right text-[#fff9ea] shadow-[0_12px_34px_rgba(2,6,23,0.18)]">
        <div className="mb-3">
          <p className="mb-1 text-xs text-slate-400">
            ילדים לא רואים כספים ובריאות פרטיים אלא אם מנהל מאפשר זאת
          </p>
          <h2 className="text-lg font-black">שיתוף והרשאות משפחתיות</h2>
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
                    ? "w-full rounded-2xl bg-slate-950 p-4 text-right text-white"
                    : "w-full rounded-2xl bg-white/[0.055] p-4 text-right text-slate-200 hover:bg-white/[0.09]"
                }
              >
                <span className="block text-base font-black">{user.name}</span>
                <span className="mt-1 block text-sm opacity-70">
                  {roleLabels[user.role]}
                </span>
              </button>
            ))}

            <div className="rounded-2xl bg-white/[0.055] p-3">
              <p className="mb-2 text-sm font-bold text-slate-300">
                הזמנת בן משפחה
              </p>
              <input
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
                className="mb-3 w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
                placeholder="שם להזמנה"
              />
              <button
                type="button"
                onClick={invitePlaceholder}
                className="w-full rounded-xl bg-[#f4e7c8] px-4 py-3 text-sm font-black text-slate-950"
              >
                הכנת הזמנה
              </button>
            </div>
          </aside>

          <div>
            <div className="mb-3 rounded-2xl bg-white/[0.055] p-4">
              <p className="text-xs text-slate-400">משתמש נבחר</p>
              <h3 className="mt-1 text-xl font-black">{selectedUser.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {selectedUser.note}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-right text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-3">מודול</th>
                    <th className="py-3">אזור</th>
                    {Object.values(permissionLabels).map((label) => (
                      <th key={label} className="py-3">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedUser.permissions.map((permission) => (
                    <tr key={permission.label} className="border-b border-white/10 text-slate-300">
                      <td className="py-3 font-black">{permission.label}</td>
                      <td className="py-3">
                        {permission.isPrivate ? "פרטי" : "משותף"}
                      </td>
                      {(Object.keys(permissionLabels) as PermissionKey[]).map(
                        (permissionKey) => (
                          <td key={permissionKey} className="py-3">
                            <label className="inline-flex cursor-pointer items-center gap-2">
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
                                className="h-4 w-4"
                              />
                              <span className="text-xs text-slate-400">
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
