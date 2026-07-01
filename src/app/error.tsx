"use client";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main
      dir="rtl"
      className="grid min-h-screen place-items-center bg-[#030712] px-6 text-[#fff9ea]"
    >
      <section className="w-full max-w-lg rounded-[32px] border border-[rgba(216,180,112,0.16)] bg-white/[0.055] p-8 text-right shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl">
        <p className="text-sm font-bold text-[#d8b470]">תקלה זמנית</p>
        <h1 className="mt-3 text-3xl font-black">משהו לא נטען כמו שצריך</h1>
        <p className="mt-3 text-sm leading-6 text-[#a9a295]">
          אפשר לנסות שוב. אם התקלה חוזרת, כדאי לשמור את פרטי הפעולה האחרונה
          שבוצעה.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-[#a9a295]">קוד תקלה: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-2xl bg-[#f4e7c8] px-5 py-3 text-sm font-black text-[#080b16] transition hover:bg-[#fff3d6]"
        >
          נסה שוב
        </button>
      </section>
    </main>
  );
}
