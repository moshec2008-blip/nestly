import type { AppRoute } from "@/types/navigation";

export type CaptureSource =
  | "quick_note"
  | "brain_dump"
  | "receipt_scan"
  | "document_upload"
  | "quick_task"
  | "quick_shopping"
  | "quick_reminder";

export type CaptureStatus =
  | "new"
  | "reviewed"
  | "converted"
  | "archived"
  | "rejected";

export type CaptureSuggestionType =
  | "task"
  | "shopping"
  | "reminder"
  | "finance_follow_up"
  | "vehicle_reminder"
  | "health_reminder"
  | "family_event"
  | "document"
  | "family_knowledge";

export type CaptureSuggestion = {
  id: string;
  type: CaptureSuggestionType;
  title: string;
  description?: string;
  dueDate?: string;
  category?: string;
  confidence: number;
  accepted: boolean;
  ignored: boolean;
  href: AppRoute;
};

export type SmartCapture = {
  id: string;
  source: CaptureSource;
  title: string;
  content: string;
  status: CaptureStatus;
  createdAt: string;
  updatedAt: string;
  suggestions: CaptureSuggestion[];
};

export function isSmartCapture(value: unknown): value is SmartCapture {
  if (!value || typeof value !== "object") {
    return false;
  }

  const capture = value as Partial<SmartCapture>;

  return (
    typeof capture.id === "string" &&
    typeof capture.source === "string" &&
    typeof capture.title === "string" &&
    typeof capture.content === "string" &&
    typeof capture.status === "string" &&
    typeof capture.createdAt === "string" &&
    typeof capture.updatedAt === "string" &&
    Array.isArray(capture.suggestions)
  );
}
