"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  archiveRelation,
  findConnectedRecords,
  migrateLegacyEntityRelations,
} from "@/services/entityRelationsService";
import type { EntityReference, RelatedRecordPreview } from "@/types/entityRelations";

type RelatedItemsPanelProps = {
  entity: EntityReference;
  title?: string;
  limit?: number;
  compact?: boolean;
};

function getIcon(entityType: RelatedRecordPreview["entityType"]) {
  if (entityType === "finance_transaction") return "₪";
  if (entityType === "document" || entityType === "receipt") return "📄";
  if (entityType === "vehicle" || entityType === "vehicle_reminder") return "🚗";
  if (entityType === "task" || entityType === "reminder") return "✓";
  if (entityType === "shopping_item" || entityType === "shopping_list") return "🛒";
  if (entityType === "family_knowledge") return "★";
  return "•";
}

export default function RelatedItemsPanel({
  entity,
  title = "פריטים קשורים",
  limit = 4,
  compact = false,
}: RelatedItemsPanelProps) {
  const [, setRefreshToken] = useState(0);
  const { entityId, entityType, familySpaceId } = entity;
  const records = findConnectedRecords({ entityId, entityType, familySpaceId });
  const confirmedRecords = records.filter((record) => record.status === "active");
  const visibleRecords = confirmedRecords.slice(0, limit);
  const remainingCount = Math.max(0, confirmedRecords.length - visibleRecords.length);

  useEffect(() => {
    migrateLegacyEntityRelations();

    function refresh() {
      setRefreshToken((current) => current + 1);
    }

    window.addEventListener("nestly-relations-change", refresh);
    return () => window.removeEventListener("nestly-relations-change", refresh);
  }, []);

  if (confirmedRecords.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-[#e3d8c9] bg-[#fffdf8]/70 p-3 text-right">
        <p className="text-sm font-black text-[#111827]">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          אין עדיין פריטים קשורים.
        </p>
      </section>
    );
  }

  return (
    <section
      className={[
        "rounded-2xl border border-[#ebe4d8] bg-white/92 text-right shadow-[0_10px_28px_rgba(33,43,63,0.055)]",
        compact ? "p-3" : "p-4",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black text-[#111827]">{title}</p>
        <span className="rounded-full bg-[#fff8eb] px-2 py-1 text-[11px] font-black text-[#7a5212] ring-1 ring-[#eadfcd]">
          {confirmedRecords.length}
        </span>
      </div>

      <div className="mt-2 divide-y divide-[#edf0f4]">
        {visibleRecords.map((record) => {
          const content = (
            <span className="flex min-w-0 items-center gap-3 py-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[#f8fafc] text-sm ring-1 ring-[#e6e8ec]">
                {getIcon(record.entityType)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-[#111827]">
                  {record.title}
                </span>
                <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">
                  {record.relationshipLabel} · {record.moduleLabel}
                </span>
              </span>
            </span>
          );

          return (
            <div key={record.relationId} className="flex items-center gap-2">
              {record.href ? (
                <Link href={record.href} className="min-w-0 flex-1">
                  {content}
                </Link>
              ) : (
                <span className="min-w-0 flex-1">{content}</span>
              )}
              <button
                type="button"
                onClick={() => {
                  archiveRelation(record.relationId);
                  window.dispatchEvent(new CustomEvent("nestly-relations-change"));
                }}
                className="min-h-9 rounded-full border border-[#e6e8ec] bg-white px-3 text-[11px] font-black text-slate-600 transition hover:bg-[#fff8eb]"
                aria-label={`הסר קישור אל ${record.title}`}
              >
                הסר
              </button>
            </div>
          );
        })}
      </div>

      {remainingCount > 0 ? (
        <p className="mt-2 text-xs font-bold text-slate-500">
          ועוד {remainingCount} פריטים קשורים
        </p>
      ) : null}
    </section>
  );
}
