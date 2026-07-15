"use client";

import { useEffect, useState } from "react";
import {
  acceptRelationSuggestion,
  findConnectedRecords,
  rejectRelationSuggestion,
} from "@/services/entityRelationsService";
import type { EntityReference, RelatedRecordPreview } from "@/types/entityRelations";

type SuggestedConnectionsPanelProps = {
  entity: EntityReference;
  title?: string;
};

export default function SuggestedConnectionsPanel({
  entity,
  title = "קישורים מוצעים",
}: SuggestedConnectionsPanelProps) {
  const [suggestions, setSuggestions] = useState<RelatedRecordPreview[]>([]);
  const { entityId, entityType, familySpaceId } = entity;

  useEffect(() => {
    let isMounted = true;

    function refresh() {
      if (isMounted) {
        setSuggestions(
          findConnectedRecords({
            entityId,
            entityType,
            familySpaceId,
          }).filter((record) => record.status === "suggested")
        );
      }
    }

    const loadTimer = window.setTimeout(refresh, 0);
    window.addEventListener("nestly-relations-change", refresh);
    return () => {
      isMounted = false;
      window.clearTimeout(loadTimer);
      window.removeEventListener("nestly-relations-change", refresh);
    };
  }, [entityId, entityType, familySpaceId]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3 text-right">
      <p className="text-sm font-black text-[#111827]">{title}</p>
      <div className="mt-2 grid gap-2">
        {suggestions.map((suggestion) => (
          <article
            key={suggestion.relationId}
            className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-sky-100"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#111827]">
                  {suggestion.title}
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  {suggestion.reason || "נראה שהפריט הזה קשור לרשומה הנוכחית."}
                </p>
              </div>
              <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-black text-sky-700 ring-1 ring-sky-100">
                הצעה
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  acceptRelationSuggestion(suggestion.relationId);
                }}
                className="min-h-9 flex-1 rounded-xl bg-[#111827] px-3 text-xs font-black text-white"
              >
                אשר קישור
              </button>
              <button
                type="button"
                onClick={() => {
                  rejectRelationSuggestion(suggestion.relationId);
                }}
                className="min-h-9 rounded-xl border border-[#e6e8ec] bg-white px-3 text-xs font-black text-slate-700"
              >
                דחה
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
