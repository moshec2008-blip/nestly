"use client";

import { useState, type ChangeEvent } from "react";
import AIErrorState from "@/components/ai/AIErrorState";
import AIProcessingState from "@/components/ai/AIProcessingState";
import AIReviewDialog from "@/components/ai/AIReviewDialog";
import { formatMoneyForReview } from "@/lib/ai/normalization/amount";
import type { AnalyzeReceiptResult } from "@/lib/ai/types";
import { getStoredAiAccessCode } from "@/services/documentAiClient";

type ReceiptScanPreviewProps = {
  userMode?: "demo" | "basic" | "authenticated";
  onConfirmExpense: (expense: {
    title: string;
    category: string;
    amount: number;
    date: string;
    notes?: string;
  }) => void;
};

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

export default function ReceiptScanPreview({
  userMode = "demo",
  onConfirmExpense,
}: ReceiptScanPreviewProps) {
  const [result, setResult] = useState<AnalyzeReceiptResult | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

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
              fileName: file.name,
              mimeType: file.type || "image/jpeg",
              size: file.size,
              sourceType: "upload",
              base64: await fileToBase64(file),
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
        throw new Error(payload.message || "לא הצלחנו לקרוא את הקבלה.");
      }

      setResult(payload.analysis);
      setIsReviewOpen(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "לא הצלחנו לקרוא את הקבלה. נסו שוב בתאורה טובה יותר."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section className="rounded-[22px] bg-[#f7fbff] p-3 text-right ring-1 ring-blue-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="min-h-11 cursor-pointer rounded-2xl bg-[#111827] px-4 py-3 text-sm font-black text-white">
          סריקת קבלה
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelection}
            className="hidden"
          />
        </label>
        <div>
          <p className="text-xs font-black text-blue-700">Nestly AI</p>
          <h3 className="text-base font-black text-[#111827]">
            קבלה להוצאה משפחתית
          </h3>
          <p className="text-xs font-semibold text-slate-600">
            ניתוח, בדיקה, ואז שמירה לפי אישור שלכם.
          </p>
        </div>
      </div>

      {isProcessing && (
        <div className="mt-3">
          <AIProcessingState activeStep={2} />
        </div>
      )}

      {errorMessage && (
        <div className="mt-3">
          <AIErrorState message={errorMessage} />
        </div>
      )}

      <AIReviewDialog
        open={isReviewOpen}
        title="בדיקת קבלה לפני שמירה"
        result={result}
        fields={[
          {
            key: "merchant",
            label: "חנות",
            value: result?.merchantName ?? "",
            confidence: result?.fieldConfidence.merchantName,
          },
          {
            key: "date",
            label: "תאריך",
            value: result?.purchaseDate ?? "",
            confidence: result?.fieldConfidence.purchaseDate,
          },
          {
            key: "total",
            label: "סכום כולל",
            value: formatMoneyForReview(result?.totalAmount),
            confidence: result?.fieldConfidence.totalAmount,
          },
          {
            key: "household",
            label: "סכום למשפחה",
            value: formatMoneyForReview(result?.householdAmount),
            confidence: result?.fieldConfidence.householdAmount,
          },
          {
            key: "category",
            label: "קטגוריה",
            value: result?.categorySuggestion ?? "מזון",
          },
        ]}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={(fields) => {
          if (!result?.householdAmount) {
            return;
          }

          onConfirmExpense({
            title: fields.merchant || result.merchantName || "קבלה",
            category: fields.category || result.categorySuggestion || "מזון",
            amount: result.householdAmount.value,
            date: fields.date || result.purchaseDate || new Date().toISOString().slice(0, 10),
            notes: result.notes,
          });
          setIsReviewOpen(false);
        }}
      />
    </section>
  );
}
