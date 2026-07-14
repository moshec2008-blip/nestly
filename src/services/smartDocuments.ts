export type SmartDocumentFilter =
  | "all"
  | "medical"
  | "finance"
  | "vehicle"
  | "family"
  | "insurance"
  | "expiring"
  | "needs_review"
  | "recent";

export type SmartDocumentType =
  | "receipt"
  | "utility_bill"
  | "insurance"
  | "medical_referral"
  | "medical_result"
  | "prescription"
  | "vehicle_document"
  | "driver_license"
  | "passport"
  | "contract"
  | "warranty"
  | "tax"
  | "school"
  | "family"
  | "other";

export type SmartDocumentSource = {
  id: string;
  title: string;
  description: string;
  owner: string;
  category: string;
  documentType?: string;
  date: string;
  expiryDate?: string;
  reminderDate?: string;
  status: "open" | "done";
  tags?: string[];
  aiSummary?: string;
  aiConfidence?: number;
  attachments?: Array<{ name: string; type: string; size: number }>;
  linkedFinanceTransactionId?: string;
  localTemporaryReference?: string;
  [key: string]: unknown;
};

export type SmartDocumentView = {
  item: SmartDocumentSource;
  smartType: SmartDocumentType;
  filterGroup: SmartDocumentFilter;
  typeLabel: string;
  summary: string;
  statusLabel: string;
  statusToneClass: string;
  extractedMetadata: Array<{ label: string; value: string }>;
  linkedModules: Array<{ label: string; href: string; description: string }>;
  needsReview: boolean;
  isExpiringSoon: boolean;
  isRecentlyAdded: boolean;
  daysUntilExpiry: number | null;
};

export const smartDocumentFilters: Array<{
  id: SmartDocumentFilter;
  label: string;
}> = [
  { id: "all", label: "הכול" },
  { id: "medical", label: "רפואי" },
  { id: "finance", label: "כספים" },
  { id: "vehicle", label: "רכב" },
  { id: "family", label: "משפחה" },
  { id: "insurance", label: "ביטוח" },
  { id: "expiring", label: "תוקף קרוב" },
  { id: "needs_review", label: "דורש בדיקה" },
  { id: "recent", label: "נוספו לאחרונה" },
];

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function getDaysUntil(date?: string) {
  if (!date) {
    return null;
  }

  const target = new Date(date);

  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function inferDocumentType(item: SmartDocumentSource): SmartDocumentType {
  const haystack = normalize([
    item.title,
    item.description,
    item.category,
    item.documentType,
    ...(item.tags ?? []),
  ].join(" "));

  if (includesAny(haystack, ["קבלה", "receipt"])) return "receipt";
  if (includesAny(haystack, ["חשבון", "מים", "חשמל", "ארנונה", "bill"])) {
    return "utility_bill";
  }
  if (includesAny(haystack, ["ביטוח", "insurance", "פוליסה"])) {
    return "insurance";
  }
  if (includesAny(haystack, ["הפניה", "טופס 17", "form 17"])) {
    return "medical_referral";
  }
  if (includesAny(haystack, ["תוצאה", "בדיקה", "medical result"])) {
    return "medical_result";
  }
  if (includesAny(haystack, ["מרשם", "תרופה", "prescription"])) {
    return "prescription";
  }
  if (includesAny(haystack, ["רכב", "טסט", "רישיון רכב"])) {
    return "vehicle_document";
  }
  if (includesAny(haystack, ["רישיון נהיגה"])) return "driver_license";
  if (includesAny(haystack, ["דרכון", "passport"])) return "passport";
  if (includesAny(haystack, ["חוזה", "contract"])) return "contract";
  if (includesAny(haystack, ["אחריות", "warranty"])) return "warranty";
  if (includesAny(haystack, ["מס", "tax", "106"])) return "tax";
  if (includesAny(haystack, ["בית ספר", "גן", "school"])) return "school";
  if (includesAny(haystack, ["משפחה", "תעודה", "family"])) return "family";

  return "other";
}

function getFilterGroup(type: SmartDocumentType): SmartDocumentFilter {
  if (
    type === "medical_referral" ||
    type === "medical_result" ||
    type === "prescription"
  ) {
    return "medical";
  }

  if (type === "receipt" || type === "utility_bill" || type === "tax") {
    return "finance";
  }

  if (type === "vehicle_document" || type === "driver_license") {
    return "vehicle";
  }

  if (type === "insurance") return "insurance";
  if (type === "passport" || type === "school" || type === "family") {
    return "family";
  }

  return "all";
}

function getTypeLabel(type: SmartDocumentType) {
  const labels: Record<SmartDocumentType, string> = {
    receipt: "קבלה",
    utility_bill: "חשבון",
    insurance: "ביטוח",
    medical_referral: "הפניה רפואית",
    medical_result: "תוצאה רפואית",
    prescription: "מרשם",
    vehicle_document: "מסמך רכב",
    driver_license: "רישיון נהיגה",
    passport: "דרכון",
    contract: "חוזה",
    warranty: "אחריות",
    tax: "מס",
    school: "בית ספר",
    family: "משפחה",
    other: "מסמך",
  };

  return labels[type];
}

function getStatus(view: {
  daysUntilExpiry: number | null;
  needsReview: boolean;
}) {
  if (view.needsReview) {
    return {
      label: "דורש בדיקה",
      className: "bg-amber-50 text-amber-700 ring-amber-100",
    };
  }

  if (view.daysUntilExpiry !== null && view.daysUntilExpiry < 0) {
    return {
      label: "פג תוקף",
      className: "bg-rose-50 text-rose-700 ring-rose-100",
    };
  }

  if (view.daysUntilExpiry !== null && view.daysUntilExpiry <= 45) {
    return {
      label: "תוקף קרוב",
      className: "bg-orange-50 text-orange-700 ring-orange-100",
    };
  }

  return {
    label: "מסודר",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  };
}

function getLinkedModules(item: SmartDocumentSource, type: SmartDocumentType) {
  const links: SmartDocumentView["linkedModules"] = [];

  if (item.linkedFinanceTransactionId || type === "receipt" || type === "utility_bill") {
    links.push({
      label: "כספים",
      href: "/finance",
      description: item.linkedFinanceTransactionId
        ? "מקושר להוצאה"
        : "אפשר לקשר להוצאה",
    });
  }

  if (
    type === "medical_referral" ||
    type === "medical_result" ||
    type === "prescription"
  ) {
    links.push({
      label: "בריאות",
      href: "/health",
      description: "תיק רפואי / משימות הכנה",
    });
  }

  if (type === "vehicle_document" || type === "driver_license" || type === "insurance") {
    links.push({
      label: type === "insurance" ? "רכבים / ביטוח" : "רכבים",
      href: "/vehicles",
      description: "תוקף, חידוש ותזכורות",
    });
  }

  if (type === "passport" || type === "school" || type === "family") {
    links.push({
      label: "משפחה",
      href: "/family",
      description: "קישור לבן משפחה",
    });
  }

  return links;
}

export function toSmartDocumentView(item: SmartDocumentSource): SmartDocumentView {
  const smartType = inferDocumentType(item);
  const daysUntilExpiry = getDaysUntil(item.expiryDate);
  const needsReview =
    item.status === "open" ||
    typeof item.aiConfidence === "number" && item.aiConfidence < 0.72;
  const isExpiringSoon =
    daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 180;
  const recentlyAddedDays = getDaysUntil(item.date);
  const isRecentlyAdded =
    recentlyAddedDays !== null && recentlyAddedDays <= 7 && recentlyAddedDays >= -7;
  const status = getStatus({ daysUntilExpiry, needsReview });
  const extractedMetadata = [
    item.owner ? { label: "אחראי", value: item.owner } : null,
    item.date ? { label: "תאריך", value: item.date } : null,
    item.expiryDate ? { label: "תוקף", value: item.expiryDate } : null,
    item.reminderDate ? { label: "תזכורת", value: item.reminderDate } : null,
    typeof item.aiConfidence === "number"
      ? { label: "ביטחון AI", value: `${Math.round(item.aiConfidence * 100)}%` }
      : null,
  ].filter((entry): entry is { label: string; value: string } => Boolean(entry));

  return {
    item,
    smartType,
    filterGroup: getFilterGroup(smartType),
    typeLabel: getTypeLabel(smartType),
    summary:
      item.aiSummary ||
      item.description ||
      `${getTypeLabel(smartType)} שמור במרכז המסמכים.`,
    statusLabel: status.label,
    statusToneClass: status.className,
    extractedMetadata,
    linkedModules: getLinkedModules(item, smartType),
    needsReview,
    isExpiringSoon,
    isRecentlyAdded,
    daysUntilExpiry,
  };
}

export function matchesSmartDocumentFilter(
  view: SmartDocumentView,
  filter: SmartDocumentFilter
) {
  if (filter === "all") return true;
  if (filter === "expiring") return view.isExpiringSoon;
  if (filter === "needs_review") return view.needsReview;
  if (filter === "recent") return view.isRecentlyAdded;
  return view.filterGroup === filter;
}

export function matchesSmartDocumentSearch(
  view: SmartDocumentView,
  query: string
) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return true;
  }

  const item = view.item;
  return [
    item.title,
    item.description,
    item.owner,
    item.category,
    item.documentType,
    item.date,
    item.expiryDate,
    view.typeLabel,
    view.summary,
    ...(item.tags ?? []),
    ...(item.attachments ?? []).map((file) => file.name),
    ...view.extractedMetadata.map((entry) => `${entry.label} ${entry.value}`),
    ...view.linkedModules.map((link) => `${link.label} ${link.description}`),
  ].some((value) => normalize(value).includes(normalizedQuery));
}

export function getSmartDocumentStats(views: SmartDocumentView[]) {
  return {
    total: views.length,
    needsReview: views.filter((view) => view.needsReview).length,
    expiringSoon: views.filter((view) => view.isExpiringSoon).length,
    linked: views.filter((view) => view.linkedModules.length > 0).length,
  };
}

export function getExpiringSmartDocuments(views: SmartDocumentView[]) {
  return views
    .filter((view) => view.isExpiringSoon)
    .sort((first, second) => {
      const firstDays = first.daysUntilExpiry ?? Number.POSITIVE_INFINITY;
      const secondDays = second.daysUntilExpiry ?? Number.POSITIVE_INFINITY;
      return firstDays - secondDays;
    })
    .slice(0, 3);
}
