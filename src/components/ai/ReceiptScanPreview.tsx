"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import AIReviewDialog from "@/components/ai/AIReviewDialog";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import {
  formatMoneyForReview,
  normalizeAmount,
} from "@/lib/ai/normalization/amount";
import type { AnalyzeReceiptResult } from "@/lib/ai/types";
import { getStoredAiAccessCode } from "@/services/documentAiClient";
import {
  buildReceiptScanRecords,
  saveReceiptDocumentMetadata,
  saveReceiptScanToStorage,
  validateReceiptSplit,
  type ReceiptScanConfirmedExpense,
} from "@/services/receiptScanPersistence";
import {
  markFirstUsefulAction,
  trackPerformanceMetric,
  trackTelemetryError,
  trackTelemetryEvent,
} from "@/services/telemetry";

type ReceiptScanPreviewProps = {
  userMode?: "demo" | "basic" | "authenticated";
  triggerClassName?: string;
  onConfirmExpense?: (expense: ReceiptScanConfirmedExpense) => void;
};

const receiptText = {
  he: {
    trigger: "סריקת קבלה",
    processing: [
      "מעלה את הקבלה...",
      "קורא את הקבלה...",
      "מזהה את פרטי הקנייה...",
      "מכין את הנתונים לבדיקה...",
    ],
    previewTitle: "סריקת קבלה",
    privacy:
      "הקבלה תעובד לצורך חילוץ פרטי הקנייה. שום דבר לא נשמר לפני אישור.",
    scan: "סרוק",
    captureAgain: "צלם שוב",
    chooseOther: "בחר קובץ אחר",
    cancel: "ביטול",
    reviewTitle: "בדיקת פרטי הקבלה",
    splitError:
      "סכום הבית וסכום ההחזר צריכים יחד להיות שווים לסכום הקבלה.",
    totalMissing: "לא זוהה סכום ברור.",
    successTitle: "הקבלה נשמרה",
    successDescription: "ההוצאה נוספה לכספים",
    viewExpense: "צפה בהוצאה",
    scanAnother: "סרוק קבלה נוספת",
    backHome: "חזרה לבית",
    unreadable: "לא הצלחנו לקרוא את הקבלה.",
    retryTip: "נסה לצלם שוב בתאורה טובה יותר.",
    unsupported: "אפשר לצרף JPG, PNG, WebP או PDF בלבד.",
    tooLarge: "הקובץ גדול מדי לניתוח.",
  },
  en: {
    trigger: "Scan receipt",
    processing: [
      "Uploading receipt...",
      "Reading receipt...",
      "Detecting purchase details...",
      "Preparing details for review...",
    ],
    previewTitle: "Receipt scan",
    privacy:
      "The receipt will be processed to extract purchase details. Nothing is saved before confirmation.",
    scan: "Scan",
    captureAgain: "Take again",
    chooseOther: "Choose another",
    cancel: "Cancel",
    reviewTitle: "Review receipt details",
    splitError:
      "Household amount and reimbursement amount must equal the receipt total.",
    totalMissing: "No clear amount was detected.",
    successTitle: "Receipt saved",
    successDescription: "The expense was added to Finance",
    viewExpense: "View expense",
    scanAnother: "Scan another receipt",
    backHome: "Back home",
    unreadable: "We could not read the receipt.",
    retryTip: "Try taking the photo again in better lighting.",
    unsupported: "Attach JPG, PNG, WebP or PDF only.",
    tooLarge: "The file is too large for analysis.",
  },
} as const;

const maxReceiptFileSize = 6 * 1024 * 1024;
const supportedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const defaultTriggerClassName =
  "inline-flex min-h-11 cursor-pointer items-center justify-center whitespace-nowrap rounded-2xl border border-white/70 bg-gradient-to-br from-[#eff6ff]/90 via-white to-[#fff8eb]/90 px-4 text-xs font-black text-[#0f3b68] shadow-[0_12px_28px_rgba(59,130,246,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(59,130,246,0.16)] active:scale-[0.99]";

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getInitialReviewValues(result: AnalyzeReceiptResult | null) {
  const totalAmount = result?.totalAmount;
  return {
    merchant: result?.merchantName ?? "",
    date: result?.purchaseDate ?? new Date().toISOString().slice(0, 10),
    total: formatMoneyForReview(totalAmount),
    currency: totalAmount?.currency ?? "ILS",
    category: result?.categorySuggestion ?? "מזון",
    household: formatMoneyForReview(result?.householdAmount ?? totalAmount),
    reimbursement: formatMoneyForReview(result?.reimbursementAmount),
    note: result?.notes ?? "",
  };
}

export default function ReceiptScanPreview({
  userMode = "demo",
  triggerClassName = defaultTriggerClassName,
  onConfirmExpense,
}: ReceiptScanPreviewProps) {
  const { toast } = useFeedback();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isConfirmingRef = useRef(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState<AnalyzeReceiptResult | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [splitError, setSplitError] = useState("");
  const [savedSummary, setSavedSummary] = useState<{
    merchant: string;
    amount: number;
    date: string;
  } | null>(null);

  const text = receiptText.he;
  const reviewDefaults = useMemo(() => getInitialReviewValues(result), [result]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!isProcessing) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setProcessingStep((currentStep) =>
        Math.min(currentStep + 1, text.processing.length - 1)
      );
    }, 900);

    return () => window.clearInterval(intervalId);
  }, [isProcessing, text.processing.length]);

  function updatePreviewForFile(file: File | null) {
    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }

      return file?.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : "";
    });
  }

  function resetFlow() {
    isConfirmingRef.current = false;
    updatePreviewForFile(null);
    setSelectedFile(null);
    setResult(null);
    setSplitError("");
    setIsPreviewOpen(false);
    setIsReviewOpen(false);
    setIsSuccessOpen(false);
  }

  function validateFile(file: File) {
    if (!supportedMimeTypes.has(file.type)) {
      return text.unsupported;
    }

    if (file.size > maxReceiptFileSize) {
      return text.tooLarge;
    }

    return "";
  }

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) {
      return;
    }

    const fileError = validateFile(file);

    if (fileError) {
      toast({
        title: text.unreadable,
        description: fileError,
        tone: "danger",
      });
      return;
    }

    setSelectedFile(file);
    trackTelemetryEvent({
      name: "receipt_scanned",
      module: "shopping",
      properties: {
        fileType: file.type || "unknown",
        fileSizeBucket:
          file.size > 3_000_000 ? "large" : file.size > 750_000 ? "medium" : "small",
        userMode,
      },
    });
    updatePreviewForFile(file);
    setResult(null);
    setSplitError("");
    setIsPreviewOpen(true);
    setIsSuccessOpen(false);
  }

  async function analyzeSelectedFile() {
    if (!selectedFile || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setProcessingStep(0);
    const startedAt = performance.now();

    try {
      const accessCode = getStoredAiAccessCode();
      const response = await fetch("/api/ai/analyze-receipt", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(accessCode ? { "x-nestly-access-code": accessCode } : {}),
        },
        body: JSON.stringify({
          userMode,
          files: [
            {
              fileName: selectedFile.name,
              mimeType: selectedFile.type,
              size: selectedFile.size,
              sourceType: "upload",
              base64: await fileToBase64(selectedFile),
            },
          ],
          mockScenario: "supermarket_receipt",
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        analysis?: AnalyzeReceiptResult;
      };

      if (!response.ok || !payload.analysis) {
        throw new Error(payload.message || text.unreadable);
      }

      setResult(payload.analysis);
      trackPerformanceMetric(
        "receipt_scan_duration",
        performance.now() - startedAt,
        "shopping"
      );
      setIsPreviewOpen(false);
      setIsReviewOpen(true);
    } catch (error) {
      trackTelemetryError("receipt-analysis", error, "shopping");
      toast({
        title: text.unreadable,
        description:
          error instanceof Error ? error.message : text.retryTip,
        tone: "danger",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  function handleConfirm(fields: Record<string, string>) {
    if (!result || !selectedFile || isProcessing || isConfirmingRef.current) {
      return;
    }

    isConfirmingRef.current = true;

    const totalAmount = normalizeAmount(fields.total);
    const householdAmount = normalizeAmount(fields.household);
    const reimbursementAmount =
      normalizeAmount(fields.reimbursement)?.value === undefined
        ? { value: 0, currency: totalAmount?.currency ?? "ILS", minorUnits: 0 }
        : normalizeAmount(fields.reimbursement);

    if (!totalAmount || !householdAmount || !reimbursementAmount) {
      setSplitError(text.totalMissing);
      isConfirmingRef.current = false;
      return;
    }

    if (
      !validateReceiptSplit(
        totalAmount.value,
        householdAmount.value,
        reimbursementAmount.value
      )
    ) {
      setSplitError(text.splitError);
      isConfirmingRef.current = false;
      return;
    }

    const { transaction, document } = buildReceiptScanRecords({
      merchant: fields.merchant || result.merchantName || "קבלה",
      category: fields.category || result.categorySuggestion || "מזון",
      purchaseDate:
        fields.date || result.purchaseDate || new Date().toISOString().slice(0, 10),
      householdAmount: householdAmount.value,
      reimbursementAmount: reimbursementAmount.value,
      originalTotal: totalAmount.value,
      currency: fields.currency || totalAmount.currency || "ILS",
      note: fields.note,
      fileName: selectedFile.name,
      mimeType: selectedFile.type,
      fileSize: selectedFile.size,
      analysis: result,
    });

    if (onConfirmExpense) {
      onConfirmExpense(transaction);
      saveReceiptDocumentMetadata(document);
    } else {
      saveReceiptScanToStorage({
        id: transaction.id,
        merchant: transaction.title,
        category: transaction.category,
        purchaseDate: transaction.date,
        householdAmount: transaction.amount,
        reimbursementAmount: transaction.reimbursementAmount ?? 0,
        originalTotal: transaction.originalTotal ?? transaction.amount,
        currency: fields.currency || totalAmount.currency || "ILS",
        note: fields.note,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        fileSize: selectedFile.size,
        analysis: result,
      });
    }

    setSavedSummary({
      merchant: transaction.title,
      amount: transaction.amount,
      date: transaction.date,
    });
    setIsReviewOpen(false);
    setIsSuccessOpen(true);
    setSplitError("");
    markFirstUsefulAction("receipt_confirmed", "shopping");
    trackTelemetryEvent({
      name: "receipt_confirmed",
      module: "shopping",
      properties: {
        userMode,
        hasReimbursement: reimbursementAmount.value > 0,
        confidenceLevel: result.confidenceLevel,
      },
    });

    toast({
      title: text.successTitle,
      description: text.successDescription,
      tone: "success",
    });

    isConfirmingRef.current = false;
  }

  return (
    <>
      <label
        className={[
          triggerClassName,
          isProcessing ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        {isProcessing ? text.processing[processingStep] : text.trigger}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          capture="environment"
          onChange={handleFileSelection}
          disabled={isProcessing}
          className="hidden"
          aria-label="צלם או העלה קבלה"
        />
      </label>

      {isPreviewOpen && selectedFile && (
        <div
          className="fixed inset-0 z-[90] grid place-items-end bg-slate-950/45 p-3 sm:place-items-center"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isProcessing) {
              resetFlow();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-preview-title"
            className="w-full max-w-lg rounded-[26px] bg-white p-4 text-right shadow-2xl ring-1 ring-[#e3d8c9]"
          >
            <h2 id="receipt-preview-title" className="text-xl font-black text-[#111827]">
              {text.previewTitle}
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              {text.privacy}
            </p>

            <div className="mt-4 overflow-hidden rounded-3xl bg-[#f8fafc] ring-1 ring-[#e6e8ec]">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="תצוגה מקדימה של הקבלה"
                  className="max-h-72 w-full object-contain"
                />
              ) : (
                <div className="grid min-h-40 place-items-center p-6 text-center">
                  <div>
                    <p className="text-sm font-black text-[#111827]">
                      {selectedFile.name}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      PDF יישלח לניתוח ללא תצוגת תמונה.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div
              className="mt-4 rounded-2xl bg-blue-50 p-3 text-sm font-semibold leading-6 text-blue-900"
              aria-live="polite"
            >
              {isProcessing ? text.processing[processingStep] : text.privacy}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={analyzeSelectedFile}
                disabled={isProcessing}
                className="min-h-12 rounded-2xl bg-[#111827] px-4 text-sm font-black text-white transition hover:bg-[#1f2937] disabled:opacity-60"
              >
                {isProcessing ? text.processing[processingStep] : text.scan}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="min-h-12 rounded-2xl border border-[#e3d8c9] bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-[#fffdf8] disabled:opacity-60"
              >
                {text.chooseOther}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="min-h-11 rounded-2xl border border-[#e3d8c9] bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-[#fffdf8] disabled:opacity-60"
              >
                {text.captureAgain}
              </button>
              <button
                type="button"
                onClick={resetFlow}
                disabled={isProcessing}
                className="min-h-11 rounded-2xl border border-[#e3d8c9] bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-[#fffdf8] disabled:opacity-60"
              >
                {text.cancel}
              </button>
            </div>
          </section>
        </div>
      )}

      <AIReviewDialog
        open={isReviewOpen}
        title={text.reviewTitle}
        result={result}
        quickActions={[
          {
            label: "הכול לבית",
            description: "כל סכום הקבלה יישמר כהוצאה משפחתית.",
            onApply: (values) => ({
              ...values,
              household: values.total,
              reimbursement: "₪0",
            }),
          },
          {
            label: "חלק מהקנייה עבור מישהו אחר",
            description: "נחשב לפי סכום ההחזר שזוהה או נשאיר לעריכה.",
            onApply: (values) => {
              const total = normalizeAmount(values.total);
              const reimbursement =
                normalizeAmount(values.reimbursement) ??
                result?.reimbursementAmount;

              if (!total || !reimbursement) {
                return values;
              }

              const household = Math.max(0, total.value - reimbursement.value);

              return {
                ...values,
                household: new Intl.NumberFormat("he-IL", {
                  style: "currency",
                  currency: total.currency || "ILS",
                  maximumFractionDigits: 2,
                }).format(household),
              };
            },
          },
        ]}
        fields={[
          {
            key: "merchant",
            label: "בית העסק",
            value: reviewDefaults.merchant,
            confidence: result?.fieldConfidence.merchantName,
          },
          {
            key: "date",
            label: "תאריך הקנייה",
            value: reviewDefaults.date,
            confidence: result?.fieldConfidence.purchaseDate,
            type: "date",
          },
          {
            key: "total",
            label: "סכום כולל",
            value: reviewDefaults.total,
            confidence: result?.fieldConfidence.totalAmount,
            inputMode: "decimal",
          },
          {
            key: "currency",
            label: "מטבע",
            value: reviewDefaults.currency,
            helperText: "ILS / USD / EUR / GBP",
          },
          {
            key: "category",
            label: "קטגוריה",
            value: reviewDefaults.category,
          },
          {
            key: "household",
            label: "סכום לבית",
            value: reviewDefaults.household,
            confidence: result?.fieldConfidence.householdAmount,
            inputMode: "decimal",
            helperText:
              (result?.fieldConfidence.householdAmount ?? 1) < 0.62
                ? "כדאי לבדוק את הפרט הזה"
                : undefined,
            errorText: splitError,
          },
          {
            key: "reimbursement",
            label: "סכום להחזר",
            value: reviewDefaults.reimbursement,
            inputMode: "decimal",
            helperText: "אם הכול לבית, השאירו 0",
          },
          {
            key: "note",
            label: "הערה אופציונלית",
            value: reviewDefaults.note,
          },
        ]}
        onClose={() => {
          setIsReviewOpen(false);
          setSplitError("");
        }}
        onConfirm={handleConfirm}
      />

      {isSuccessOpen && savedSummary && (
        <div className="fixed inset-0 z-[90] grid place-items-end bg-slate-950/45 p-3 sm:place-items-center">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-success-title"
            className="w-full max-w-md rounded-[26px] bg-white p-5 text-right shadow-2xl ring-1 ring-[#e3d8c9]"
          >
            <p className="text-xs font-black text-emerald-700">
              {text.successDescription}
            </p>
            <h2
              id="receipt-success-title"
              className="mt-1 text-2xl font-black text-[#111827]"
            >
              {text.successTitle}
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              {savedSummary.merchant} · ₪
              {savedSummary.amount.toLocaleString("he-IL")} · {savedSummary.date}
            </p>
            <div className="mt-5 grid gap-2">
              <Link
                href="/finance"
                className="grid min-h-12 place-items-center rounded-2xl bg-[#111827] px-4 text-sm font-black text-white"
              >
                {text.viewExpense}
              </Link>
              <button
                type="button"
                onClick={() => {
                  resetFlow();
                  fileInputRef.current?.click();
                }}
                className="min-h-11 rounded-2xl border border-[#e3d8c9] bg-white px-4 text-sm font-black text-slate-700"
              >
                {text.scanAnother}
              </button>
              <Link
                href="/"
                className="grid min-h-11 place-items-center rounded-2xl border border-[#e3d8c9] bg-white px-4 text-sm font-bold text-slate-700"
              >
                {text.backHome}
              </Link>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
