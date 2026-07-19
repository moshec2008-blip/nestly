export type ModuleRecordStatus = "open" | "done";

export type ModuleRecord = {
  id: string;
  title: string;
  description: string;
  owner: string;
  category: string;
  date: string;
  status: ModuleRecordStatus;
  completedAt?: string;
};

export function isModuleRecord(value: unknown): value is ModuleRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<ModuleRecord>;

  return (
    typeof record.id === "string" &&
    record.id.length > 0 &&
    typeof record.title === "string" &&
    (record.status === "open" || record.status === "done") &&
    (record.completedAt === undefined || typeof record.completedAt === "string")
  );
}
