import type {
  ImportPreviewRecord,
  ImportValidationIssue,
} from "@/types/importExport";

const maxImportBytes = 2 * 1024 * 1024;
const maxImportRecords = 1000;
const dangerousSpreadsheetPrefixes = ["=", "+", "-", "@", "\t", "\r"];

export function sanitizeCsvCell(value: string) {
  const trimmedValue = value.trim();

  return dangerousSpreadsheetPrefixes.some((prefix) =>
    trimmedValue.startsWith(prefix)
  )
    ? `'${trimmedValue}`
    : value;
}

export function validateImportFile(input: {
  fileName: string;
  sizeBytes: number;
  mimeType?: string;
}) {
  const issues: ImportValidationIssue[] = [];
  const lowerName = input.fileName.toLowerCase();
  const supported =
    lowerName.endsWith(".json") ||
    lowerName.endsWith(".csv") ||
    input.mimeType === "application/json" ||
    input.mimeType === "text/csv";

  if (!supported) {
    issues.push({
      code: "unsupported_file_type",
      message: "Only JSON and CSV imports are supported in this foundation.",
      severity: "error",
    });
  }

  if (input.sizeBytes > maxImportBytes) {
    issues.push({
      code: "file_too_large",
      message: "Import file is larger than the safe beta limit.",
      severity: "error",
    });
  }

  return issues;
}

export function validateImportPreview(records: ImportPreviewRecord[]) {
  const issues: ImportValidationIssue[] = [];

  if (records.length > maxImportRecords) {
    issues.push({
      code: "too_many_records",
      message: "Import contains more records than the current beta limit.",
      severity: "error",
    });
  }

  const duplicateKeys = new Set<string>();

  records.forEach((record, index) => {
    if (!record.normalizedTitle.trim()) {
      issues.push({
        row: index + 1,
        code: "missing_title",
        message: "Record is missing a title.",
        severity: "error",
      });
    }

    if (duplicateKeys.has(record.duplicateKey)) {
      issues.push({
        row: index + 1,
        code: "duplicate_in_file",
        message: "This record appears more than once in the import file.",
        severity: "warning",
      });
    }

    duplicateKeys.add(record.duplicateKey);
  });

  return issues;
}
