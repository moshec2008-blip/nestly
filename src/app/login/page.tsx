import AuthManager from "@/components/auth/AuthManager";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8eb_0%,#f7f3eb_42%,#eef3f8_100%)] text-[#111827]">
      <AuthManager />
    </main>
  );
}
