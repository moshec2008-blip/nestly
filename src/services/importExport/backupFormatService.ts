import type { VersionedNestlyBackup } from "@/types/importExport";

export function createVersionedBackup(input: {
  familySpaceId: string;
  familySpaceName?: string;
  recordsByEntityType: Record<string, unknown[]>;
  relationships?: unknown[];
  settings?: Record<string, unknown>;
  templates?: unknown[];
  collections?: unknown[];
  automations?: unknown[];
  timelineMetadata?: unknown[];
}): VersionedNestlyBackup {
  const records = Object.values(input.recordsByEntityType).reduce(
    (total, items) => total + items.length,
    0
  );

  return {
    app: "nestly",
    format: "nestly-backup",
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    familySpace: {
      id: input.familySpaceId,
      name: input.familySpaceName,
    },
    manifest: {
      records,
      includesFiles: false,
      encrypted: false,
    },
    recordsByEntityType: input.recordsByEntityType,
    relationships: input.relationships ?? [],
    settings: input.settings ?? {},
    templates: input.templates ?? [],
    collections: input.collections ?? [],
    automations: input.automations ?? [],
    timelineMetadata: input.timelineMetadata ?? [],
  };
}

export function validateVersionedBackup(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const backup = value as Partial<VersionedNestlyBackup>;

  return (
    backup.app === "nestly" &&
    backup.format === "nestly-backup" &&
    backup.schemaVersion === 2 &&
    typeof backup.exportedAt === "string" &&
    Boolean(backup.familySpace) &&
    Boolean(backup.manifest) &&
    Boolean(backup.recordsByEntityType) &&
    typeof backup.recordsByEntityType === "object"
  );
}
