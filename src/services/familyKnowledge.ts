import { storageKeys } from "@/lib/storageKeys";
import type {
  FamilyKnowledgeItem,
  KnowledgeCategory,
  KnowledgeCreateInput,
  KnowledgeLinkedModule,
} from "@/types/knowledge";
import { isFamilyKnowledgeItem } from "@/types/knowledge";
import { readStorageArray, writeStorage } from "@/utils/storage";

export const defaultKnowledgeCategories: KnowledgeCategory[] = [
  {
    id: "home",
    label: "בית",
    description: "מידע שימושי על הבית",
    linkedModule: "home",
  },
  {
    id: "vehicles",
    label: "רכב",
    description: "מוסכים, חלקים וטיפים לרכב",
    linkedModule: "vehicles",
    href: "/vehicles",
  },
  {
    id: "family",
    label: "משפחה",
    description: "העדפות, מידות ופרטים משפחתיים",
    linkedModule: "family",
    href: "/family",
  },
  {
    id: "health",
    label: "בריאות",
    description: "העדפות רפואיות ומידע שימושי",
    linkedModule: "health",
    href: "/health",
  },
  {
    id: "documents",
    label: "מסמכים",
    description: "הקשרים ותזכורות למסמכים",
    linkedModule: "documents",
    href: "/documents",
  },
  {
    id: "finance",
    label: "כספים",
    description: "ביטוחים, תשלומים ותהליכים",
    linkedModule: "finance",
    href: "/finance",
  },
  {
    id: "shopping",
    label: "קניות",
    description: "צריכה קבועה והעדפות קנייה",
    linkedModule: "shopping",
    href: "/shopping",
  },
  {
    id: "equipment",
    label: "ציוד",
    description: "דגמים, מידות וחלקי חילוף",
    linkedModule: "general",
  },
  {
    id: "school",
    label: "בית ספר",
    description: "מסגרות, הסעות ופרטים לילדים",
    linkedModule: "family",
    href: "/family",
  },
  {
    id: "contacts",
    label: "אנשי קשר",
    description: "ספקים ואנשי מקצוע חשובים",
    linkedModule: "family",
    href: "/family",
  },
  {
    id: "other",
    label: "אחר",
    description: "כל מה שחשוב לזכור",
    linkedModule: "general",
  },
];

function nowIso() {
  return new Date().toISOString();
}

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0591-\u05C7]/g, "");
}

function splitTags(value: string | string[] | undefined) {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : value.split(",");

  return Array.from(
    new Set(values.map((tag) => tag.trim()).filter((tag) => tag.length > 0))
  );
}

function buildSearchKeywords(item: {
  title: string;
  content: string;
  category: string;
  tags: string[];
  linkedModule?: KnowledgeLinkedModule;
}) {
  return Array.from(
    new Set(
      [
        item.title,
        item.content,
        item.category,
        item.linkedModule ?? "",
        ...item.tags,
      ]
        .flatMap((value) => value.split(/\s+/))
        .map(normalize)
        .filter(Boolean)
    )
  );
}

function sortKnowledge(items: FamilyKnowledgeItem[]) {
  return [...items].sort((first, second) => {
    if (first.pinned !== second.pinned) {
      return first.pinned ? -1 : 1;
    }

    if (first.favorite !== second.favorite) {
      return first.favorite ? -1 : 1;
    }

    return second.updatedAt.localeCompare(first.updatedAt);
  });
}

export function readKnowledgeItems(options?: { includeArchived?: boolean }) {
  const items = readStorageArray<FamilyKnowledgeItem>(
    storageKeys.familyKnowledge,
    [],
    isFamilyKnowledgeItem
  );

  return sortKnowledge(
    options?.includeArchived ? items : items.filter((item) => !item.archived)
  );
}

function writeKnowledgeItems(items: FamilyKnowledgeItem[]) {
  return writeStorage(storageKeys.familyKnowledge, items);
}

export function createKnowledgeItem(input: KnowledgeCreateInput) {
  const timestamp = nowIso();
  const category = input.category?.trim() || "אחר";
  const tags = splitTags(input.tags);
  const item: FamilyKnowledgeItem = {
    id: crypto.randomUUID(),
    title: input.title.trim() || "מידע משפחתי",
    content: input.content.trim(),
    category,
    tags,
    linkedModule: input.linkedModule,
    linkedEntityId: input.linkedEntityId,
    linkedFamilyMemberId: input.linkedFamilyMemberId,
    createdBy: input.createdBy,
    createdAt: timestamp,
    updatedAt: timestamp,
    pinned: false,
    archived: false,
    visibility: "family",
    attachments: [],
    sourceNoteId: input.sourceNoteId,
    sourceDocumentId: input.sourceDocumentId,
    searchKeywords: [],
    favorite: false,
  };

  const itemWithKeywords = {
    ...item,
    searchKeywords: buildSearchKeywords(item),
  };

  writeKnowledgeItems([itemWithKeywords, ...readKnowledgeItems({ includeArchived: true })]);
  return itemWithKeywords;
}

export function updateKnowledgeItem(
  id: string,
  patch: Partial<
    Pick<
      FamilyKnowledgeItem,
      | "title"
      | "content"
      | "category"
      | "tags"
      | "linkedModule"
      | "linkedEntityId"
      | "linkedFamilyMemberId"
      | "visibility"
    >
  >
) {
  let updatedItem: FamilyKnowledgeItem | null = null;
  const items = readKnowledgeItems({ includeArchived: true }).map((item) => {
    if (item.id !== id) {
      return item;
    }

    const nextItem = {
      ...item,
      ...patch,
      tags: patch.tags ? splitTags(patch.tags) : item.tags,
      updatedAt: nowIso(),
    };
    updatedItem = {
      ...nextItem,
      searchKeywords: buildSearchKeywords(nextItem),
    };
    return updatedItem;
  });

  writeKnowledgeItems(items);
  return updatedItem;
}

export function setKnowledgePinned(id: string, pinned: boolean) {
  return updateKnowledgeFlag(id, { pinned });
}

export function setKnowledgeFavorite(id: string, favorite: boolean) {
  return updateKnowledgeFlag(id, { favorite });
}

export function archiveKnowledgeItem(id: string) {
  return updateKnowledgeFlag(id, { archived: true });
}

export function restoreKnowledgeItem(id: string) {
  return updateKnowledgeFlag(id, { archived: false });
}

export function markKnowledgeViewed(id: string) {
  return updateKnowledgeFlag(id, { lastViewed: nowIso() });
}

function updateKnowledgeFlag(
  id: string,
  patch: Partial<
    Pick<FamilyKnowledgeItem, "pinned" | "favorite" | "archived" | "lastViewed">
  >
) {
  let updatedItem: FamilyKnowledgeItem | null = null;
  const items = readKnowledgeItems({ includeArchived: true }).map((item) => {
    if (item.id !== id) {
      return item;
    }

    updatedItem = { ...item, ...patch, updatedAt: nowIso() };
    return updatedItem;
  });

  writeKnowledgeItems(items);
  return updatedItem;
}

export function searchKnowledgeItems(query: string, options?: { includeArchived?: boolean }) {
  const normalizedQuery = normalize(query);
  const items = readKnowledgeItems(options);

  if (!normalizedQuery) {
    return items;
  }

  return items.filter((item) =>
    [
      item.title,
      item.content,
      item.category,
      item.linkedModule ?? "",
      ...item.tags,
      ...item.searchKeywords,
    ].some((value) => normalize(value).includes(normalizedQuery))
  );
}

export function getRelatedKnowledge(item: FamilyKnowledgeItem, limit = 4) {
  return readKnowledgeItems()
    .filter((candidate) => candidate.id !== item.id)
    .filter(
      (candidate) =>
        candidate.category === item.category ||
        (item.linkedModule && candidate.linkedModule === item.linkedModule) ||
        candidate.tags.some((tag) => item.tags.includes(tag))
    )
    .slice(0, limit);
}
