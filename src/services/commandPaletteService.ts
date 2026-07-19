import type { AppLanguage } from "@/i18n/config";
import type { CommandPaletteCommand } from "@/types/commands";
import { matchesSearchQuery, scoreSearchMatch } from "@/lib/search/searchNormalization";

const commandsByLanguage: Record<"he" | "en", CommandPaletteCommand[]> = {
  he: [
    {
      id: "quick_note",
      label: "Universal Inbox",
      description: "שמור כל דבר, ו-Nestly תציע לאן זה שייך",
      keywords: ["inbox", "שמירה", "לכידה", "סריקה", "קובץ", "פתק", "קבלה"],
      icon: "spark",
      category: "capture",
      eventName: "nestly-open-universal-inbox",
      eventDetail: { source: "text", mode: "text" },
      priority: 100,
    },
    {
      id: "scan_receipt",
      label: "סריקת קבלה",
      description: "פתח את זרימת סריקת הקבלה",
      keywords: ["סרוק", "קבלה", "חשבונית", "הוצאה", "סופר"],
      icon: "document",
      category: "quick_action",
      eventName: "nestly-open-universal-inbox",
      eventDetail: { source: "camera_scan", mode: "files" },
      priority: 98,
    },
    {
      id: "open_handle",
      label: "פתח את לטיפול",
      description: "מה דורש טיפול עכשיו",
      keywords: ["לטיפול", "מרכז", "דחוף", "חשוב", "מה עכשיו"],
      icon: "check",
      category: "navigation",
      route: "/handle",
      priority: 94,
    },
    {
      id: "create_task",
      label: "הוסף משימה",
      description: "פתח את אזור המשימות ליצירה",
      keywords: ["הוסף משימה", "צור משימה", "מטלה", "תזכורת"],
      icon: "check",
      category: "quick_action",
      route: "/tasks",
      priority: 92,
    },
    {
      id: "add_shopping_item",
      label: "הוסף מוצר לקניות",
      description: "פתח את רשימת הקניות",
      keywords: ["קניות", "מוצר", "רשימת קניות", "סופר"],
      icon: "shopping",
      category: "quick_action",
      route: "/shopping",
      priority: 90,
    },
    {
      id: "upload_document",
      label: "העלה מסמך",
      description: "פתח את מרכז המסמכים",
      keywords: ["מסמך", "העלה", "קובץ", "תיוק"],
      icon: "document",
      category: "quick_action",
      route: "/documents",
      priority: 88,
    },
    {
      id: "add_family_knowledge",
      label: "הוסף מידע משפחתי",
      description: "שמור משהו שהבית צריך לזכור",
      keywords: ["מידע", "ידע", "זיכרון", "משפחתי", "פתק"],
      icon: "knowledge",
      category: "quick_action",
      route: "/knowledge",
      priority: 86,
    },
    {
      id: "open_finance",
      label: "פתח כספים",
      description: "הכנסות, הוצאות ותקציב",
      keywords: ["כספים", "תקציב", "הוצאות", "הכנסות"],
      icon: "finance",
      category: "navigation",
      route: "/finance",
      priority: 80,
    },
    {
      id: "open_settings",
      label: "פתח הגדרות",
      description: "העדפות, נגישות ופרטיות",
      keywords: ["הגדרות", "נגישות", "שפה", "תצוגה"],
      icon: "settings",
      category: "settings",
      route: "/settings",
      priority: 70,
    },
  ],
  en: [
    {
      id: "quick_note",
      label: "Universal Inbox",
      description: "Save anything and let Nestly suggest where it belongs",
      keywords: ["inbox", "save", "capture", "scan", "file", "note", "receipt"],
      icon: "spark",
      category: "capture",
      eventName: "nestly-open-universal-inbox",
      eventDetail: { source: "text", mode: "text" },
      priority: 100,
    },
    {
      id: "scan_receipt",
      label: "Scan receipt",
      description: "Open the receipt scan flow",
      keywords: ["receipt", "scan", "expense", "bill"],
      icon: "document",
      category: "quick_action",
      eventName: "nestly-open-universal-inbox",
      eventDetail: { source: "camera_scan", mode: "files" },
      priority: 98,
    },
    {
      id: "open_handle",
      label: "Open Handle",
      description: "See what needs attention now",
      keywords: ["handle", "urgent", "important", "attention"],
      icon: "check",
      category: "navigation",
      route: "/handle",
      priority: 94,
    },
    {
      id: "create_task",
      label: "Add task",
      description: "Open Tasks to create a task",
      keywords: ["task", "todo", "reminder"],
      icon: "check",
      category: "quick_action",
      route: "/tasks",
      priority: 92,
    },
    {
      id: "add_shopping_item",
      label: "Add shopping item",
      description: "Open the shopping list",
      keywords: ["shopping", "product", "grocery"],
      icon: "shopping",
      category: "quick_action",
      route: "/shopping",
      priority: 90,
    },
    {
      id: "upload_document",
      label: "Upload document",
      description: "Open the Document Center",
      keywords: ["document", "file", "upload"],
      icon: "document",
      category: "quick_action",
      route: "/documents",
      priority: 88,
    },
    {
      id: "add_family_knowledge",
      label: "Add family knowledge",
      description: "Save something the home should remember",
      keywords: ["knowledge", "memory", "note"],
      icon: "knowledge",
      category: "quick_action",
      route: "/knowledge",
      priority: 86,
    },
    {
      id: "open_finance",
      label: "Open Finance",
      description: "Income, expenses and budget",
      keywords: ["finance", "budget", "expense", "income"],
      icon: "finance",
      category: "navigation",
      route: "/finance",
      priority: 80,
    },
    {
      id: "open_settings",
      label: "Open Settings",
      description: "Preferences, accessibility and privacy",
      keywords: ["settings", "accessibility", "language", "appearance"],
      icon: "settings",
      category: "settings",
      route: "/settings",
      priority: 70,
    },
  ],
};

function getLanguageKey(language: AppLanguage) {
  return language === "he" || language === "yi" ? "he" : "en";
}

export function getCommandPaletteCommands(language: AppLanguage) {
  return commandsByLanguage[getLanguageKey(language)];
}

export function searchCommandPaletteCommands(query: string, language: AppLanguage) {
  const commands = getCommandPaletteCommands(language);

  if (!query.trim()) {
    return commands.slice(0, 6);
  }

  return commands
    .filter((command) =>
      matchesSearchQuery(query, [
        command.label,
        command.description,
        ...command.keywords,
      ])
    )
    .sort(
      (firstCommand, secondCommand) =>
        scoreSearchMatch(
          query,
          secondCommand.label,
          `${secondCommand.description} ${secondCommand.keywords.join(" ")}`
        ) +
          secondCommand.priority -
        (scoreSearchMatch(
          query,
          firstCommand.label,
          `${firstCommand.description} ${firstCommand.keywords.join(" ")}`
        ) +
          firstCommand.priority)
    )
    .slice(0, 6);
}
