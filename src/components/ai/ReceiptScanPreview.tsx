"use client";

import { useState, type ChangeEvent } from "react";
import AIReviewDialog from "@/components/ai/AIReviewDialog";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { formatMoneyForReview } from "@/lib/ai/normalization/amount";
import type { AnalyzeReceiptResult } from "@/lib/ai/types";
import { getStoredAiAccessCode } from "@/services/documentAiClient";

type ReceiptScanPreviewProps = {
  userMode?: "demo" | "basic" | "authenticated";
  triggerClassName?: string;
  onConfirmExpense: (expense: {
    title: string;
    category: string;
    amount: number;
    date: string;
    notes?: string;
  }) => void;
};

const defaultTriggerClassName =
  "inline-flex min-h-11 cursor-pointer items-center justify-center whitespace-nowrap rounded-2xl border border-white/70 bg-gradient-to-br from-[#eff6ff]/90 via-white to-[#fff8eb]/90 px-4 text-xs font-black text-[#0f3b68] shadow-[0_12px_28px_rgba(59,130,246,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(59,130,246,0.16)]";

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
  triggerClassName = defaultTriggerClassName,
  onConfirmExpense,
}: ReceiptScanPreviewProps) {
  const { toast } = useFeedback();
  const [result, setResult] = useState<AnalyzeReceiptResult | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsProcessing(true);

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
      toast({
        title: "הסריקה לא הצליחה",
        description:
          error instanceof Error
            ? error.message
            : "לא הצלחנו לקרוא את הקבלה. נסו שוב בתאורה טובה יותר.",
        tone: "danger",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <>
      <label
        className={[
          triggerClassName,
          isProcessing ? "pointer-events-none opacity-60" : "",
        ].join(" ")}
      >
        {isProcessing ? "קורא את הקבלה..." : "סריקת קבלה"}
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileSelection}
          disabled={isProcessing}
          className="hidden"
        />
      </label>

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
    </>
  );
}
