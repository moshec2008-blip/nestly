import type { CommonDictionary } from "@/i18n/dictionaries";
import type { AppRoute } from "@/types/navigation";

type NavKey = keyof CommonDictionary["nav"];

const routeNavKeys: Record<AppRoute, NavKey> = {
  "/": "home",
  "/finance": "finance",
  "/tasks": "tasks",
  "/dashboard": "dashboard",
  "/health": "health",
  "/documents": "documents",
  "/vehicles": "vehicles",
  "/family": "family",
  "/birthdays": "birthdays",
  "/shopping": "shopping",
  "/security": "permissions",
  "/permissions": "permissions",
  "/settings": "settings",
};

export function getRouteLabel(route: AppRoute, dictionary: CommonDictionary) {
  return dictionary.nav[routeNavKeys[route]];
}
