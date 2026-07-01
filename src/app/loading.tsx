import { brand } from "@/lib/branding";

export default function Loading() {
  return (
    <main
      dir="rtl"
      className="grid min-h-screen place-items-center bg-[#030712] px-6 text-[#fff9ea]"
    >
      <section className="w-full max-w-md rounded-[32px] border border-[rgba(216,180,112,0.16)] bg-white/[0.055] p-8 text-center shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl">
        <p className="text-sm font-bold text-[#d8b470]">{brand.productName}</p>
        <h1 className="mt-3 text-2xl font-black">טוען את הבית...</h1>
        <p className="mt-3 text-sm text-[#a9a295]">
          מכינים את המרחב המשפחתי של {brand.workspaceName}.
        </p>
      </section>
    </main>
  );
}
