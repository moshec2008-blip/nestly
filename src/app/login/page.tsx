import AuthManager from "@/components/auth/AuthManager";
import { getAuthSetupStatus } from "@/lib/auth";

export default function LoginPage() {
  const authSetup = getAuthSetupStatus();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8eb_0%,#f7f3eb_42%,#eef3f8_100%)] text-[#111827]">
      <AuthManager authSetup={authSetup} />
    </main>
  );
}
