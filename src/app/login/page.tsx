import LoginClient from "@/components/auth/LoginClient";
import { getAuthSetupStatus } from "@/lib/auth";

export default function LoginPage() {
  return <LoginClient setup={getAuthSetupStatus()} />;
}
