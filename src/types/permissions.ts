import type { AppRoute } from "@/types/navigation";

export type FamilyRole = "admin" | "spouse" | "child" | "limited";

export type ModulePermission = {
  module: AppRoute;
  label: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  isPrivate: boolean;
};

export type FamilyPermissionUser = {
  id: string;
  name: string;
  role: FamilyRole;
  note: string;
  permissions: ModulePermission[];
};

export function isFamilyPermissionUser(
  value: unknown
): value is FamilyPermissionUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Partial<FamilyPermissionUser>;

  return (
    typeof user.id === "string" &&
    user.id.length > 0 &&
    typeof user.name === "string" &&
    Array.isArray(user.permissions)
  );
}
