import type { FinanceTransaction } from "@/data/finance";
import type { AnalyzeReceiptResult } from "@/lib/ai/types";
import { storageKeys } from "@/lib/storageKeys";
import { readStorageArray, writeStorage } from "@/utils/storage";

export type ReceiptDocumentMetadata = {
  id: string;
  title: string;
  documentType: "receipt";
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  merchant: string;
  purchaseDate: string;
  totalAmount: number;
  currency: string;
  linkedFinanceTransactionId: string;
  localTemporaryReference: string;
  aiAnalysisStatus: "reviewed" | "low_confidence_reviewed";
  aiConfidence: number;
  familySpaceId?: string;
  userId?: string;
};

export type ReceiptScanConfirmedExpense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  source: "receipt_scan";
  receiptReference: string;
  documentReference: string;
  originalTotal: number;
  reimbursementAmount: number;
  aiConfidence: number;
};

export type ReceiptScanSaveInput = {
  id?: string;
  merchant: string;
  category: string;
  purchaseDate: string;
  householdAmount: number;
  reimbursementAmount: number;
  originalTotal: number;
  currency: string;
  note?: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  analysis: AnalyzeReceiptResult;
};

export function validateReceiptSplit(
  totalAmount: number,
  householdAmount: number,
  reimbursementAmount: number
) {
  const roundedTotal = Math.round(totalAmount * 100);
  const roundedParts = Math.round((householdAmount + reimbursementAmount) * 100);

  return roundedTotal === roundedParts;
}

function buildReceiptDocumentId(transactionId: string) {
  return `receipt-doc-${transactionId}`;
}

export function buildReceiptScanRecords(input: ReceiptScanSaveInput) {
  const transactionId = input.id || crypto.randomUUID();
  const documentId = buildReceiptDocumentId(transactionId);
  const title = input.merchant.trim() || "קבלה";
  const createdAt = new Date().toISOString();

  const transaction: FinanceTransaction & ReceiptScanConfirmedExpense = {
    id: transactionId,
    title,
    category: input.category.trim() || "מזון",
    amount: input.householdAmount,
    type: "expense",
    date: input.purchaseDate,
    status: "done",
    notes: input.note,
    source: "receipt_scan",
    receiptReference: documentId,
    documentReference: documentId,
    originalTotal: input.originalTotal,
    reimbursementAmount: input.reimbursementAmount,
    aiConfidence: input.analysis.confidence,
  };

  const document: ReceiptDocumentMetadata = {
    id: documentId,
    title: `קבלה · ${title}`,
    documentType: "receipt",
    originalFileName: input.fileName,
    mimeType: input.mimeType,
    fileSize: input.fileSize,
    createdAt,
    merchant: title,
    purchaseDate: input.purchaseDate,
    totalAmount: input.originalTotal,
    currency: input.currency,
    linkedFinanceTransactionId: transactionId,
    localTemporaryReference: `local-receipt:${documentId}`,
    aiAnalysisStatus:
      input.analysis.confidenceLevel === "low"
        ? "low_confidence_reviewed"
        : "reviewed",
    aiConfidence: input.analysis.confidence,
  };

  return { transaction, document };
}

export function saveReceiptDocumentMetadata(document: ReceiptDocumentMetadata) {
  const documents = readStorageArray<ReceiptDocumentMetadata>(
    storageKeys.receiptDocuments,
    []
  );
  const withoutDuplicate = documents.filter((item) => item.id !== document.id);
  const receiptWriteSucceeded = writeStorage(storageKeys.receiptDocuments, [
    document,
    ...withoutDuplicate,
  ]);

  const documentRecords = readStorageArray<Record<string, unknown>>(
    storageKeys.documents,
    []
  );
  const documentRecord = {
    id: document.id,
    title: document.title,
    description: `קבלה מ-${document.merchant} · ${document.totalAmount.toLocaleString("he-IL")} ${document.currency}`,
    owner: "הבית",
    category: "קבלות",
    documentType: "קבלה",
    date: document.purchaseDate,
    status: "done",
    attachments: [],
    tags: ["קבלה", "כספים", document.merchant],
    aiSummary: "קבלה שנשמרה לאחר בדיקת AI ואישור משתמש.",
    aiConfidence: document.aiConfidence,
    linkedFinanceTransactionId: document.linkedFinanceTransactionId,
    localTemporaryReference: document.localTemporaryReference,
  };
  const withoutDocumentDuplicate = documentRecords.filter(
    (item) => item.id !== document.id
  );
  const documentWriteSucceeded = writeStorage(storageKeys.documents, [
    documentRecord,
    ...withoutDocumentDuplicate,
  ]);

  return receiptWriteSucceeded && documentWriteSucceeded;
}

export function saveReceiptScanToStorage(input: ReceiptScanSaveInput) {
  const { transaction, document } = buildReceiptScanRecords(input);
  const transactions = readStorageArray<FinanceTransaction>(
    storageKeys.finance,
    []
  );
  const alreadyExists = transactions.some((item) => item.id === transaction.id);

  if (!alreadyExists) {
    writeStorage(storageKeys.finance, [transaction, ...transactions]);
  }

  saveReceiptDocumentMetadata(document);

  return { transaction, document };
}
