type AIWarningListProps = {
  warnings: string[];
  missingFields: string[];
};

export default function AIWarningList({
  warnings,
  missingFields,
}: AIWarningListProps) {
  if (warnings.length === 0 && missingFields.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-900 ring-1 ring-amber-100">
      {warnings.length > 0 ? <p>{warnings[0]}</p> : null}
      {missingFields.length > 0 ? (
        <p className="mt-1">יש פרטים שלא זוהו בוודאות, ולכן כדאי לבדוק לפני שמירה.</p>
      ) : null}
    </div>
  );
}
