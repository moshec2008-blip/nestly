"use client";

import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { brand } from "@/lib/branding";

export default function SecurityManager() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-[24px] bg-white/92 p-4 text-right shadow-[0_16px_40px_rgba(33,43,63,0.08)] ring-1 ring-[#eadfcd]">
        <p className="text-xs font-black text-[#007aff]">אבטחה</p>
        <h1 className="mt-1 text-2xl font-black text-[#111827]">
          החשבון שמגן על המרחב המשפחתי
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
          Nestly מכיל מידע משפחתי רגיש. הכניסה מתבצעת עם Google, והנתונים
          המקומיים בדפדפן מופרדים לפי החשבון המחובר.
        </p>

        <div className="mt-4 rounded-[20px] bg-[#fafafb] p-3">
          {status === "loading" ? (
            <p className="text-sm font-black text-slate-600">בודק חשבון...</p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="min-h-11 w-fit rounded-2xl border border-[#e6e8ec] bg-white px-4 text-sm font-black text-slate-700 hover:bg-[#fff8eb]"
              >
                התנתקות
              </button>

              <div className="flex items-center justify-end gap-3">
                <div>
                  <p className="text-xs font-black text-slate-500">
                    מחובר עם Google
                  </p>
                  <h2 className="mt-1 text-lg font-black text-[#111827]">
                    {user?.name || "משתמש Nestly"}
                  </h2>
                  <p className="text-sm font-semibold text-slate-600">
                    {user?.email}
                  </p>
                </div>
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt=""
                    width={52}
                    height={52}
                    className="h-12 w-12 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff8eb] text-lg font-black text-[#7a5212] ring-1 ring-[#eadfcd]">
                    {user?.name?.[0] || "N"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#fffdf8] p-3 ring-1 ring-[#eadfcd]">
            <p className="text-[11px] font-black text-slate-500">שיטת כניסה</p>
            <p className="mt-1 text-sm font-black text-[#111827]">Google OAuth</p>
          </div>
          <div className="rounded-2xl bg-[#fffdf8] p-3 ring-1 ring-[#eadfcd]">
            <p className="text-[11px] font-black text-slate-500">שמירה מקומית</p>
            <p className="mt-1 text-sm font-black text-[#111827]">
              מופרדת לפי משתמש
            </p>
          </div>
          <div className="rounded-2xl bg-[#fffdf8] p-3 ring-1 ring-[#eadfcd]">
            <p className="text-[11px] font-black text-slate-500">מרחב</p>
            <p className="mt-1 text-sm font-black text-[#111827]">
              {brand.workspaceName}
            </p>
          </div>
        </div>
      </div>

      <aside className="rounded-[24px] bg-gradient-to-br from-[#fff8eb] to-white p-4 text-right shadow-[0_16px_40px_rgba(33,43,63,0.08)] ring-1 ring-[#eadfcd]">
        <p className="text-xs font-black text-slate-500">מה מוגן?</p>
        <h2 className="mt-1 text-lg font-black text-[#111827]">
          מידע משפחתי פרטי
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          כספים, בריאות, מסמכים, משימות, בני משפחה, אירועים ורכבים נגישים רק
          אחרי התחברות.
        </p>
        <div className="mt-4 rounded-2xl bg-white/78 p-3 text-xs font-bold leading-5 text-slate-600 ring-1 ring-white">
          בהמשך ניתן לחבר מסד נתונים, הזמנות לבני משפחה, הרשאות לפי תפקידים
          והצפנת מסמכים.
        </div>
      </aside>
    </section>
  );
}
