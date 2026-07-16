import type { AppIconName } from "@/components/ui/AppIcon";
import type { AppRoute } from "@/types/navigation";

export type CommandCategory =
  | "quick_action"
  | "navigation"
  | "capture"
  | "settings";

export type CommandPaletteCommand = {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  icon: AppIconName;
  category: CommandCategory;
  route?: AppRoute;
  eventName?: string;
  eventDetail?: Record<string, string>;
  priority: number;
  requiresConfirmation?: boolean;
};
