import Link from "next/link";

export default function NotFound() {
  return (
    <main
      dir="rtl"
      className="grid min-h-screen place-items-center bg-[#f6f3ec] px-6 text-[#111827]"
    >
      <section className="w-full max-w-lg rounded-[30px] border border-[#eadfcd] bg-white/92 p-6 text-right shadow-[0_24px_70px_rgba(33,43,63,0.12)]">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a5b16]">
          404
        </p>
        <h1 className="mt-2 text-3xl font-black">העמוד לא נמצא</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          הקישור לא מוביל לאזור פעיל. אפשר לחזור לבית ולהמשיך משם בצורה מסודרת.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-5 text-sm font-black text-[#111827] shadow-[0_10px_22px_rgba(33,43,63,0.08)] transition hover:bg-white"
        >
          חזרה לבית
        </Link>
      </section>
    </main>
  );
}
