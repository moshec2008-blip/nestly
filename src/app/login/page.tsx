import { redirect } from "next/navigation";

// התחברות עם Google מנוטרלת בינתיים — אין מסך התחברות, עוברים ישר לאפליקציה.
export default function LoginPage() {
  redirect("/");
}
