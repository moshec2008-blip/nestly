import type {
  FamilyPermissionUser,
  FamilyRole,
  ModulePermission,
} from "@/types/permissions";

export const roleLabels: Record<FamilyRole, string> = {
  admin: "מנהל",
  spouse: "בן/בת זוג",
  child: "ילד/ה",
  limited: "צפייה מוגבלת",
};

export const defaultModulePermissions: ModulePermission[] = [
  {
    module: "/finance",
    label: "כספים",
    view: true,
    create: true,
    edit: true,
    delete: false,
    isPrivate: true,
  },
  {
    module: "/health",
    label: "בריאות",
    view: true,
    create: true,
    edit: true,
    delete: false,
    isPrivate: true,
  },
  {
    module: "/documents",
    label: "מסמכים",
    view: true,
    create: true,
    edit: true,
    delete: false,
    isPrivate: true,
  },
  {
    module: "/tasks",
    label: "משימות",
    view: true,
    create: true,
    edit: true,
    delete: false,
    isPrivate: false,
  },
  {
    module: "/shopping",
    label: "קניות",
    view: true,
    create: true,
    edit: true,
    delete: false,
    isPrivate: false,
  },
  {
    module: "/birthdays",
    label: "ימי הולדת",
    view: true,
    create: false,
    edit: false,
    delete: false,
    isPrivate: false,
  },
];

export const initialPermissionUsers: FamilyPermissionUser[] = [
  {
    id: "permission-1",
    name: "מוישי",
    role: "admin",
    note: "מנהל מלא של המערכת.",
    permissions: defaultModulePermissions.map((permission) => ({
      ...permission,
      view: true,
      create: true,
      edit: true,
      delete: true,
    })),
  },
  {
    id: "permission-2",
    name: "אושרית",
    role: "spouse",
    note: "שותפה מלאה לניהול הבית.",
    permissions: defaultModulePermissions,
  },
  {
    id: "permission-3",
    name: "יאיר יהודה",
    role: "child",
    note: "גישה למשימות, קניות וימי הולדת בלבד.",
    permissions: defaultModulePermissions.map((permission) => ({
      ...permission,
      view: !permission.isPrivate,
      create: !permission.isPrivate && permission.module !== "/birthdays",
      edit: !permission.isPrivate && permission.module !== "/birthdays",
      delete: false,
    })),
  },
  {
    id: "permission-4",
    name: "צופה משפחתי",
    role: "limited",
    note: "צפייה מוגבלת באזורים משותפים.",
    permissions: defaultModulePermissions.map((permission) => ({
      ...permission,
      view: !permission.isPrivate,
      create: false,
      edit: false,
      delete: false,
    })),
  },
];
