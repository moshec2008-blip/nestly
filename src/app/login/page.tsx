import AuthManager from "@/components/auth/AuthManager";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/layout/PageHero";

export default function LoginPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="כניסה מאובטחת"
        title="חשבון והרשאות"
        description="כניסה ל-Nestly עם Google OAuth או מייל וסיסמה לחשבון Nestly. הרשאות המשפחה מנוהלות על ידי מנהל המרחב."
        showBackHome
      />

      <AuthManager />
    </AppShell>
  );
}

