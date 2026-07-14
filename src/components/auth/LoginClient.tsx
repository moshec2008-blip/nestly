"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { brand } from "@/lib/branding";
import { trackTelemetryEvent } from "@/services/telemetry";

type AuthSetupStatus = {
  hasGoogleClientId: boolean;
  hasGoogleClientSecret: boolean;
  hasSecret: boolean;
  hasUrl: boolean;
  googleConfigured: boolean;
  readyForProduction: boolean;
};

type LoginClientProps = {
  setup: AuthSetupStatus;
};

function getMissingSetupItems(setup: AuthSetupStatus) {
  const missingItems: string[] = [];

  if (!setup.hasGoogleClientId) missingItems.push("GOOGLE_CLIENT_ID");
  if (!setup.hasGoogleClientSecret) missingItems.push("GOOGLE_CLIENT_SECRET");
  if (!setup.hasSecret) missingItems.push("NEXTAUTH_SECRET או AUTH_SECRET");
  if (!setup.hasUrl) missingItems.push("NEXTAUTH_URL או AUTH_URL");

  return missingItems;
}

export default function LoginClient({ setup }: LoginClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  const missingItems = useMemo(() => getMissingSetupItems(setup), [setup]);

  async function handleGoogleSignIn() {
    if (!setup.googleConfigured) {
      trackTelemetryEvent({
        name: "auth_login_failed",
        module: "auth",
        properties: { reason: "missing_google_setup" },
      });
      return;
    }

    setIsSubmitting(true);
    trackTelemetryEvent({
      name: "auth_login_started",
      module: "auth",
      properties: { provider: "google" },
    });
    await signIn("google", { callbackUrl });
    setIsSubmitting(false);
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f6f1e8] px-4 py-8 text-[#111827]"
    >
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="rounded-[30px] bg-white/94 p-5 text-right shadow-[0_24px_80px_rgba(33,43,63,0.14)] ring-1 ring-[#eadfcd]">
          <div className="flex items-center justify-end gap-3">
            <div>
              <p className="text-xs font-black text-[#8a5b16]">
                מרחב משפחתי פרטי
              </p>
              <h1 className="mt-1 text-2xl font-black">{brand.productName}</h1>
            </div>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff8eb] p-2 ring-1 ring-[#eadfcd]">
              <Image
                src="/nestly-logo.png"
                alt=""
                width={48}
                height={48}
                className="h-full w-full object-contain"
                priority
              />
            </span>
          </div>

          <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
            התחברות מאפשרת לשמור את המידע המשפחתי בצורה מבודדת, להכין סנכרון
            בין מכשירים ולבנות בהמשך שיתוף משפחתי מאובטח.
          </p>

          {status === "authenticated" && (
            <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800 ring-1 ring-emerald-100">
              אתם כבר מחוברים. אפשר לחזור למרחב המשפחתי.
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100">
              לא הצלחנו להשלים את ההתחברות. נסו שוב בעוד רגע.
            </div>
          )}

          {!setup.googleConfigured && (
            <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-800 ring-1 ring-amber-100">
              התחברות Google עדיין לא מוגדרת בסביבה הזו. חסרים:
              <span className="mt-1 block font-black">
                {missingItems.join(", ")}
              </span>
            </div>
          )}

          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={!setup.googleConfigured || isSubmitting}
              className="min-h-12 rounded-2xl bg-[#111827] px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(17,24,39,0.18)] transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? "מעבירים ל-Google..." : "התחברות עם Google"}
            </button>

            <button
              type="button"
              onClick={() => {
                trackTelemetryEvent({
                  name: "guest_mode_started",
                  module: "auth",
                  properties: { source: "login_page" },
                });
                router.push("/");
              }}
              className="min-h-12 rounded-2xl border border-[#eadfcd] bg-[#fffdf8] px-5 text-sm font-black text-slate-700 transition hover:bg-white"
            >
              המשך במצב בסיסי
            </button>

            <Link
              href="/"
              className="text-center text-xs font-bold text-slate-500 transition hover:text-slate-800"
            >
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
