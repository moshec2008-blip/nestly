import { trackTelemetryEvent } from "@/services/telemetry";
import type {
  BackgroundJob,
  BackgroundJobStatus,
  CreateBackgroundJobInput,
} from "./types";

const jobsStorageKey = "nestly-background-jobs";
const jobsChangedEventName = "nestly-background-jobs-change";
const maxStoredJobs = 80;

function createJobId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `job_${crypto.randomUUID()}`;
  }

  return `job_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function now() {
  return new Date().toISOString();
}

function readJobs(): BackgroundJob[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(jobsStorageKey);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? (parsedValue as BackgroundJob[]) : [];
  } catch {
    return [];
  }
}

function writeJobs(jobs: BackgroundJob[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    jobsStorageKey,
    JSON.stringify(jobs.slice(0, maxStoredJobs))
  );
  window.dispatchEvent(new CustomEvent(jobsChangedEventName));
}

function updateJob(jobId: string, update: Partial<BackgroundJob>) {
  const jobs = readJobs();
  const nextJobs = jobs.map((job) =>
    job.id === jobId ? { ...job, ...update, updatedAt: now() } : job
  );

  writeJobs(nextJobs);
}

export function getBackgroundJobs() {
  return readJobs();
}

export function getBackgroundJobsChangedEventName() {
  return jobsChangedEventName;
}

export function createBackgroundJob(input: CreateBackgroundJobInput) {
  const job: BackgroundJob = {
    id: createJobId(),
    type: input.type,
    status: "queued",
    createdAt: now(),
    updatedAt: now(),
    progress: 0,
    attempts: 0,
    maxAttempts: input.maxAttempts ?? 3,
    safeLabel: input.safeLabel.slice(0, 80),
  };

  writeJobs([job, ...readJobs()]);
  trackTelemetryEvent({
    name: "job_queued",
    module: "app",
    properties: { type: job.type },
  });

  return job;
}

export function markBackgroundJobRunning(jobId: string) {
  const job = readJobs().find((item) => item.id === jobId);

  updateJob(jobId, {
    status: "running",
    attempts: (job?.attempts ?? 0) + 1,
  });
}

export function updateBackgroundJobProgress(jobId: string, progress: number) {
  updateJob(jobId, {
    progress: Math.max(0, Math.min(100, Math.round(progress))),
  });
}

export function finishBackgroundJob(
  jobId: string,
  status: Extract<BackgroundJobStatus, "succeeded" | "failed" | "cancelled">,
  errorCode?: string
) {
  const job = readJobs().find((item) => item.id === jobId);

  updateJob(jobId, {
    status,
    progress: status === "succeeded" ? 100 : job?.progress ?? 0,
    errorCode,
  });

  trackTelemetryEvent({
    name:
      status === "succeeded"
        ? "job_succeeded"
        : status === "cancelled"
          ? "job_cancelled"
          : "job_failed",
    module: "app",
    properties: { type: job?.type ?? "unknown", status },
  });
}

