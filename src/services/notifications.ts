import type { AppRoute } from "@/types/navigation";
import { getTodayAttentionItems } from "@/services/familyIntelligence";

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  href: AppRoute;
  tone: "info" | "warning" | "danger";
};

function notificationTone(tone: string): AppNotification["tone"] {
  if (tone === "danger") {
    return "danger";
  }

  if (tone === "warning") {
    return "warning";
  }

  return "info";
}

export function getAppNotifications(): AppNotification[] {
  return getTodayAttentionItems("he")
    .filter((item) => item.tone !== "good")
    .map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      href: item.href,
      tone: notificationTone(item.tone),
    }))
    .slice(0, 6);
}
