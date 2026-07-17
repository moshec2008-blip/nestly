"use client";

import { useEffect, useMemo, useState } from "react";
import AppIcon from "@/components/ui/AppIcon";
import type {
  OperationalHealthSnapshot,
  OperationalStatus,
} from "@/lib/operations/health";
import {
  getBackgroundJobs,
  getBackgroundJobsChangedEventName,
} from "@/lib/jobs/localJobQueue";
import type { BackgroundJob } from "@/lib/jobs/types";
import { getTelemetryEvents, type TelemetryEvent } from "@/services/telemetry";

type OperationsDashboardProps = {
  snapshot: OperationalHealthSnapshot;
};

type LocalCloudSummary = {
  users: number;
  familySpaces: number;
  memberships: number;
  invitations: number;
  records: number;
  migrations: number;
};

type StorageSummary = {
  nestlyKeys: number;
  estimatedKb: number;
  largestKeys: Array<{ key: string; kb: number }>;
};

const statusStyles: Record<OperationalStatus, string> = {
  healthy: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  degraded: "bg-amber-50 text-amber-700 ring-amber-200",
  not_configured: "bg-slate-100 text-slate-600 ring-slate-200",
  unknown: "bg-slate-100 text-slate-600 ring-slate-200",
};

const statusLabels: Record<OperationalStatus, string> = {
  healthy: "תקין",
  degraded: "חלקי",
  not_configured: "לא מוגדר",
  unknown: "לא ידוע",
};

function readLocalCloudSummary(): LocalCloudSummary {
  if (typeof window === "undefined") {
    return {
      users: 0,
      familySpaces: 0,
      memberships: 0,
      invitations: 0,
      records: 0,
      migrations: 0,
    };
  }

  try {
    const rawValue = window.localStorage.getItem("nestly-cloud-foundation");
    const parsed = rawValue ? JSON.parse(rawValue) : {};

    return {
      users: Array.isArray(parsed.users) ? parsed.users.length : 0,
      familySpaces: Array.isArray(parsed.familySpaces)
        ? parsed.familySpaces.length
        : 0,
      memberships: Array.isArray(parsed.memberships)
        ? parsed.memberships.length
        : 0,
      invitations: Array.isArray(parsed.invitations)
        ? parsed.invitations.length
        : 0,
      records: Array.isArray(parsed.records) ? parsed.records.length : 0,
      migrations: Array.isArray(parsed.migrations)
        ? parsed.migrations.length
        : 0,
    };
  } catch {
    return {
      users: 0,
      familySpaces: 0,
      memberships: 0,
      invitations: 0,
      records: 0,
      migrations: 0,
    };
  }
}

function readStorageSummary(): StorageSummary {
  if (typeof window === "undefined") {
    return { nestlyKeys: 0, estimatedKb: 0, largestKeys: [] };
  }

  const keys = Array.from({ length: window.localStorage.length }, (_, index) =>
    window.localStorage.key(index)
  ).filter((key): key is string => Boolean(key?.startsWith("nestly")));
  const items = keys
    .map((key) => {
      const value = window.localStorage.getItem(key) ?? "";
      return {
        key,
        kb: Math.round(((key.length + value.length) * 2) / 102.4) / 10,
      };
    })
    .sort((a, b) => b.kb - a.kb);

  return {
    nestlyKeys: keys.length,
    estimatedKb: Math.round(items.reduce((total, item) => total + item.kb, 0)),
    largestKeys: items.slice(0, 5),
  };
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-[22px] bg-white/92 p-4 text-right shadow-sm ring-1 ring-[#eadfcd]">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
      {helper ? (
        <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

function HealthPill({ status }: { status: OperationalStatus }) {
  return (
    <span
      className={[
        "inline-flex min-h-8 items-center rounded-full px-3 text-xs font-black ring-1",
        statusStyles[status],
      ].join(" ")}
    >
      {statusLabels[status]}
    </span>
  );
}

function countEvents(events: TelemetryEvent[], predicate: (event: TelemetryEvent) => boolean) {
  return events.filter(predicate).length;
}

function countJobs(jobs: BackgroundJob[], status: BackgroundJob["status"]) {
  return jobs.filter((job) => job.status === status).length;
}

export default function OperationsDashboard({
  snapshot,
}: OperationsDashboardProps) {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [storageVersion, setStorageVersion] = useState(0);

  useEffect(() => {
    function sync() {
      setEvents(getTelemetryEvents());
      setJobs(getBackgroundJobs());
      setStorageVersion((current) => current + 1);
    }

    sync();
    window.addEventListener("nestly-telemetry-change", sync);
    window.addEventListener(getBackgroundJobsChangedEventName(), sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("nestly-telemetry-change", sync);
      window.removeEventListener(getBackgroundJobsChangedEventName(), sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const localCloud = useMemo(() => {
    void storageVersion;
    return readLocalCloudSummary();
  }, [storageVersion]);
  const storage = useMemo(() => {
    void storageVersion;
    return readStorageSummary();
  }, [storageVersion]);
  const errorRate = events.length
    ? Math.round((countEvents(events, (event) => event.name === "app_error") / events.length) * 100)
    : 0;
  const failedJobs = countJobs(jobs, "failed");

  return (
    <section className="space-y-4 text-right text-slate-950">
      <section className="rounded-[28px] bg-gradient-to-l from-[#eef7ff] via-white to-[#fff8eb] p-5 shadow-[0_18px_46px_rgba(33,43,63,0.08)] ring-1 ring-[#d7e2f1]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#1f5f9f] shadow-sm ring-1 ring-[#d7e2f1]">
              <AppIcon name="settings" className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-black text-[#007aff]">
                Internal operations
              </p>
              <h1 className="text-3xl font-black">מרכז תפעול פנימי</h1>
            </div>
          </div>
          <div className="rounded-2xl bg-white/82 px-4 py-3 text-sm font-bold text-slate-600 ring-1 ring-[#d7e2f1]">
            גרסה {snapshot.deployment.version} · {snapshot.deployment.environment}
          </div>
        </div>
        <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-600">
          מסך פנימי למעקב תפעולי בלבד. הוא מציג סטטוסים, ספירות ומזהים טכניים
          ללא תוכן משפחתי פרטי.
        </p>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="משפחות" value={localCloud.familySpaces} helper="מקומי/Cloud foundation" />
        <MetricCard label="חשבונות" value={localCloud.users} helper="ללא הצגת אימיילים" />
        <MetricCard label="אחסון מקומי" value={`${storage.estimatedKb}KB`} helper={`${storage.nestlyKeys} מפתחות Nestly`} />
        <MetricCard label="שגיאות" value={`${errorRate}%`} helper={`${events.length} אירועים מקומיים`} />
      </div>

      <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black">בריאות מערכת</h2>
          <p className="text-xs font-bold text-slate-500">
            עודכן: {new Date(snapshot.generatedAt).toLocaleString("he-IL")}
          </p>
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {snapshot.services.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-[#fffdf8] px-3 py-3 ring-1 ring-[#edf0f4]"
            >
              <HealthPill status={service.status} />
              <div>
                <p className="text-sm font-black">{service.label}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {service.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-2">
        <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
          <h2 className="text-xl font-black">תורי רקע</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <MetricCard label="בתור" value={countJobs(jobs, "queued")} />
            <MetricCard label="רץ" value={countJobs(jobs, "running")} />
            <MetricCard label="הושלם" value={countJobs(jobs, "succeeded")} />
            <MetricCard label="נכשל" value={failedJobs} />
          </div>
          <div className="mt-3 space-y-2">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.id} className="rounded-2xl bg-[#fffdf8] px-3 py-2 ring-1 ring-[#edf0f4]">
                <p className="text-sm font-black">{job.safeLabel}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {job.type} · {job.status} · {job.progress}%
                </p>
              </div>
            ))}
            {jobs.length === 0 ? (
              <p className="rounded-2xl bg-[#fffdf8] px-3 py-4 text-sm font-semibold text-slate-500">
                אין כרגע עבודות רקע מקומיות.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
          <h2 className="text-xl font-black">שימוש ועלויות</h2>
          <div className="mt-3 space-y-2">
            {storage.largestKeys.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-2xl bg-[#fffdf8] px-3 py-2 ring-1 ring-[#edf0f4]"
              >
                <span className="text-xs font-black text-slate-500">
                  {item.kb}KB
                </span>
                <span className="truncate text-sm font-bold text-slate-700">
                  {item.key}
                </span>
              </div>
            ))}
            {storage.largestKeys.length === 0 ? (
              <p className="rounded-2xl bg-[#fffdf8] px-3 py-4 text-sm font-semibold text-slate-500">
                אין עדיין נתוני אחסון של Nestly בדפדפן הזה.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
        <h2 className="text-xl font-black">Feature flags</h2>
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {snapshot.featureFlags.map((flag) => (
            <div
              key={flag.key}
              className="rounded-2xl bg-[#fffdf8] px-3 py-3 ring-1 ring-[#edf0f4]"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-black ring-1",
                    flag.enabled
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-slate-100 text-slate-600 ring-slate-200",
                  ].join(" ")}
                >
                  {flag.enabled ? "פעיל" : "כבוי"}
                </span>
                <div>
                  <p className="text-sm font-black">{flag.label}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {flag.stage} · {flag.envName}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {flag.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] bg-white/92 p-4 shadow-sm ring-1 ring-[#eadfcd]">
        <h2 className="text-xl font-black">תמיכה וביקורת</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <MetricCard label="הזמנות" value={localCloud.invitations} helper="סטטוס בלבד, ללא תוכן" />
          <MetricCard label="חברויות" value={localCloud.memberships} helper="תפקידים והרשאות" />
          <MetricCard label="רשומות" value={localCloud.records} helper="ספירה בלבד, ללא נתונים" />
        </div>
        <p className="mt-3 rounded-2xl bg-[#fff8eb] px-3 py-3 text-sm font-semibold leading-6 text-slate-600 ring-1 ring-[#eadfcd]">
          לפני Production צריך להחליף את הסיכומים המקומיים בלוח תפעול שמחובר
          למסד נתונים, הרשאות Admin אמיתיות, Audit log שרת, והתראות.
        </p>
      </section>
    </section>
  );
}
