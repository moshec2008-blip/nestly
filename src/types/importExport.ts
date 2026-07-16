export type ImportSourceType = "nestly_backup" | "json" | "csv";

export type ImportJobStatus =
  | "draft"
  | "validated"
  | "needs_mapping"
  | "ready"
  | "completed"
  | "partial"
  | "failed";

export type ImportValidationIssue = {
  row?: number;
  field?: string;
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type ImportPreviewRecord = {
  sourceId?: string;
  targetModule: string;
  normalizedTitle: string;
  duplicateKey: string;
  valid: boolean;
  issues: ImportValidationIssue[];
};

export type ImportJob = {
  id: string;
  familySpaceId: string;
  sourceType: ImportSourceType;
  sourceFileHash: string;
  status: ImportJobStatus;
  previewRecords: ImportPreviewRecord[];
  importedSourceIds: string[];
  issues: ImportValidationIssue[];
  createdAt: string;
  updatedAt: string;
};

export type ExportFormat = "nestly_backup_json" | "module_csv" | "family_summary_json";

export type ExportJob = {
  id: string;
  familySpaceId: string;
  format: ExportFormat;
  requestedByUserId: string;
  includedModules: string[];
  status: "prepared" | "downloaded" | "failed";
  warningAccepted: boolean;
  createdAt: string;
};

export type VersionedNestlyBackup = {
  app: "nestly";
  format: "nestly-backup";
  schemaVersion: 2;
  exportedAt: string;
  familySpace: {
    id: string;
    name?: string;
  };
  manifest: {
    records: number;
    includesFiles: false;
    encrypted: false;
  };
  recordsByEntityType: Record<string, unknown[]>;
  relationships: unknown[];
  settings: Record<string, unknown>;
  templates: unknown[];
  collections: unknown[];
  automations: unknown[];
  timelineMetadata: unknown[];
};
