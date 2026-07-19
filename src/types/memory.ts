import type { AppIconName } from "@/components/ui/AppIcon";
import type { AppRoute } from "@/types/navigation";

export type MemoryDomain =
  | "knowledge"
  | "documents"
  | "finance"
  | "family"
  | "health"
  | "vehicles"
  | "tasks"
  | "shopping"
  | "life"
  | "birthdays"
  | "inbox";

export type MemoryItem = {
  id: string;
  domain: MemoryDomain;
  title: string;
  description: string;
  meta: string;
  href: AppRoute;
  icon: AppIconName;
  status?: string;
  date?: string;
  keywords: string[];
  updatedAt?: string;
  savedAt?: string;
  sourceLabel: string;
  matchScore?: number;
};

export type MemoryRecentItem = {
  id: string;
  viewedAt: string;
};

export type MemoryGroup = {
  domain: MemoryDomain;
  label: string;
  description: string;
  items: MemoryItem[];
};

export type MemoryState = {
  query: string;
  total: number;
  items: MemoryItem[];
  groups: MemoryGroup[];
  recentlyViewed: MemoryItem[];
  recentlySaved: MemoryItem[];
  recentlyUpdated: MemoryItem[];
  warnings: string[];
};
