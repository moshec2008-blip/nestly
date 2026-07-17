import { brand } from "@/lib/branding";

export default function Loading() {
  return (
    <main
      dir="rtl"
      className="grid min-h-screen place-items-center bg-[#f6f3ec] px-6 text-[#111827]"
    >
      <section className="w-full max-w-md rounded-[30px] border border-[#eadfcd] bg-white/92 p-6 text-center shadow-[0_24px_70px_rgba(33,43,63,0.12)]">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#fff8eb] text-sm font-black text-[#7a5212] ring-1 ring-[#eadfcd]">
          {brand.productName.slice(0, 1)}
        </div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a5b16]">
          {brand.productName}
        </p>
        <h1 className="mt-2 text-2xl font-black">טוען את המרחב המשפחתי</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm font-semibold leading-6 text-slate-600">
          מכינים את מה שחשוב לבית. זה ייקח רגע קצר.
        </p>
        <div className="mt-6 space-y-3" aria-hidden="true">
          <div className="h-3 rounded-full bg-slate-100" />
          <div className="mx-auto h-3 w-4/5 rounded-full bg-slate-100" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-16 rounded-2xl bg-[#fff8eb]" />
            <div className="h-16 rounded-2xl bg-[#eef7ff]" />
            <div className="h-16 rounded-2xl bg-[#f0fbf4]" />
          </div>
        </div>
      </section>
    </main>
  );
}
