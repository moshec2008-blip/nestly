type AIErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export default function AIErrorState({
  title = "הסריקה לא הושלמה",
  message,
  onRetry,
}: AIErrorStateProps) {
  return (
    <div className="rounded-2xl bg-rose-50 p-4 text-right text-rose-900 ring-1 ring-rose-100">
      <p className="text-sm font-black">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 min-h-10 rounded-xl bg-white px-4 text-sm font-black text-rose-900 ring-1 ring-rose-200"
        >
          נסו שוב
        </button>
      )}
    </div>
  );
}
