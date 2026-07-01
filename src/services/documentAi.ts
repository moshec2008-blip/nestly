export type DocumentAiFile = {
  name: string;
  type: string;
};

export type DocumentAiInput = {
  title: string;
  description: string;
  files: DocumentAiFile[];
};

export type DocumentAiSuggestion = {
  title: string;
  category: string;
  summary: string;
  tags: string[];
  confidence: number;
};

export const documentAiStatus = {
  mode: "local-preview",
  description:
    "תיוק חכם מקומי לפי שם קובץ, סוג קובץ וטקסט שהוזן. בהמשך אפשר להחליף את הפונקציה בקריאת API ל-AI אמיתי עם OCR.",
  futurePipeline: [
    "סריקה או העלאת קובץ",
    "OCR להוצאת טקסט",
    "AI מסווג קטגוריה, תגיות וסיכום",
    "שמירה במודול המתאים והרצת תזכורות",
  ],
} as const;

const categoryRules = [
  {
    category: "ביטוח",
    tags: ["ביטוח", "פוליסה", "חידוש"],
    keywords: ["ביטוח", "פוליסה", "insurance", "policy", "claim"],
  },
  {
    category: "בריאות",
    tags: ["בריאות", "רופא", "בדיקה"],
    keywords: ["רופא", "בדיקה", "תרופה", "health", "medical", "doctor", "scan"],
  },
  {
    category: "חינוך",
    tags: ["חינוך", "בית ספר", "אישור"],
    keywords: ["בית ספר", "לימודים", "גן", "school", "education", "student"],
  },
  {
    category: "רכב",
    tags: ["רכב", "טסט", "טיפול"],
    keywords: ["רכב", "טסט", "מוסך", "vehicle", "car", "license", "garage"],
  },
  {
    category: "כספים",
    tags: ["כספים", "חשבונית", "תשלום"],
    keywords: ["חשבונית", "קבלה", "תשלום", "invoice", "receipt", "payment"],
  },
];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function getBaseTitle(input: DocumentAiInput) {
  const cleanTitle = input.title.trim();

  if (cleanTitle) {
    return cleanTitle;
  }

  const firstFileName = input.files[0]?.name;

  if (!firstFileName) {
    return "מסמך חדש";
  }

  return firstFileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
}

export function suggestDocumentClassification(
  input: DocumentAiInput
): DocumentAiSuggestion {
  const searchableText = normalize(
    [
      input.title,
      input.description,
      ...input.files.map((file) => `${file.name} ${file.type}`),
    ].join(" ")
  );

  const matchedRule =
    categoryRules.find((rule) =>
      rule.keywords.some((keyword) => searchableText.includes(normalize(keyword)))
    ) ?? categoryRules[categoryRules.length - 1];

  const fileCount = input.files.length;
  const fileTypes = Array.from(
    new Set(
      input.files
        .map((file) => file.type.split("/")[1] || file.type)
        .filter(Boolean)
    )
  );

  return {
    title: getBaseTitle(input),
    category: matchedRule.category,
    tags: matchedRule.tags,
    confidence: fileCount > 0 ? 0.76 : 0.58,
    summary:
      fileCount > 0
        ? `זוהו ${fileCount} קבצים${fileTypes.length ? ` מסוג ${fileTypes.join(", ")}` : ""}. מוצע לתייק תחת ${matchedRule.category}.`
        : `מוצע לתייק תחת ${matchedRule.category} לפי הטקסט שהוזן.`,
  };
}
