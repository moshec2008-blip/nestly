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
