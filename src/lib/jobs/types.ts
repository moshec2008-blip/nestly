export type BackgroundJobType =
  | "import"
  | "export"
  | "ai_processing"
  | "scheduled_summary"
  | "notification"
  | "sync";

export type BackgroundJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type BackgroundJob = {
  id: string;
  type: BackgroundJobType;
  status: BackgroundJobStatus;
  createdAt: string;
  updatedAt: string;
  progress: number;
  attempts: number;
  maxAttempts: number;
  errorCode?: string;
  safeLabel: string;
};

export type CreateBackgroundJobInput = {
  type: BackgroundJobType;
  safeLabel: string;
  maxAttempts?: number;
};

