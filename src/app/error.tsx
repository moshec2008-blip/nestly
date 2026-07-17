"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main
      dir="rtl"
      className="grid min-h-screen place-items-center bg-[#f6f3ec] px-6 text-[#111827]"
    >
      <section className="w-full max-w-lg rounded-[30px] border border-[#eadfcd] bg-white/92 p-6 text-right shadow-[0_24px_70px_rgba(33,43,63,0.12)]">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a5b16]">
          תקלה זמנית
        </p>
        <h1 className="mt-2 text-3xl font-black">משהו לא נטען כמו שצריך</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          אפשר לנסות שוב בלי לאבד את הדרך. אם זה חוזר, כדאי לרענן ולנסות את
          הפעולה האחרונה פעם נוספת.
        </p>
        {error.digest && (
          <p className="mt-3 rounded-2xl bg-[#fafafb] px-3 py-2 text-xs font-bold text-slate-500">
            קוד תקלה: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-6 min-h-11 rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-5 text-sm font-black text-[#111827] shadow-[0_10px_22px_rgba(33,43,63,0.08)] transition hover:bg-white"
        >
          נסו שוב
        </button>
      </section>
    </main>
  );
}
