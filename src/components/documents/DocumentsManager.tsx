"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useAuthPrompt } from "@/components/auth/AuthPromptProvider";
import RelatedItemsPanel from "@/components/relations/RelatedItemsPanel";
import SuggestedConnectionsPanel from "@/components/relations/SuggestedConnectionsPanel";
import { setFinanceDraft, setTaskDraft } from "@/lib/actionDrafts";
import {
  deleteAttachmentData,
  getAttachmentData,
  saveAttachmentData,
} from "@/lib/attachmentStore";
import DateInput from "@/components/ui/DateInput";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { storageKeys } from "@/lib/storageKeys";
import {
  documentAiStatus,
  suggestDocumentClassification,
  type DocumentAiSuggestion,
} from "@/services/documentAi";
import { analyzeDocumentSmart } from "@/services/documentAiClient";
import {
  getExpiringSmartDocuments,
  getSmartDocumentStats,
  matchesSmartDocumentFilter,
  matchesSmartDocumentSearch,
  smartDocumentFilters,
  toSmartDocumentView,
  type SmartDocumentFilter,
} from "@/services/smartDocuments";
import {
  markFirstUsefulAction,
  trackPerformanceMetric,
  trackTelemetryError,
  trackTelemetryEvent,
} from "@/services/telemetry";

type DocumentStatus = "open" | "done";

type Attachment = {
  // מזהה הקובץ ב-IndexedDB; רשומות ישנות (לפני ההגירה) נושאות dataUrl במקום.
  id?: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  source?: "upload" | "scan";
};

type DocumentItem = {
  id: string;
  title: string;
  description: string;
  owner: string;
  category: string;
  documentType?: string;
  date: string;
  expiryDate?: string;
  reminderDate?: string;
  status: DocumentStatus;
  attachments: Attachment[];
  tags?: string[];
  aiSummary?: string;
  aiConfidence?: number;
  linkedFinanceTransactionId?: string;
  localTemporaryReference?: string;
};

type DocumentForm = {
  title: string;
  description: string;
  owner: string;
  category: string;
  documentType: string;
  date: string;
  expiryDate: string;
  reminderDate: string;
  tagsText: string;
  files: File[];
};

// הקבצים נשמרים ב-IndexedDB, כך שאפשר להרשות קבצים גדולים יותר מבעבר.
const maxLocalFileSize = 10 * 1024 * 1024;

const initialDocuments: DocumentItem[] = [
  {
    id: "document-1",
    title: "ביטוח דירה",
    description: "לשמור פוליסה עדכנית ולבדוק תאריך חידוש.",
    owner: "הבית",
    category: "ביטוח",
    documentType: "פוליסה",
    date: "2026-08-01",
    expiryDate: "2027-08-01",
    reminderDate: "2027-07-01",
    status: "open",
    attachments: [
      {
        name: "פוליסה-לדוגמה.pdf",
        size: 245760,
        type: "application/pdf",
      },
    ],
  },
  {
    id: "document-2",
    title: "מסמכי בית ספר",
    description: "לרכז אישורים וטפסים לשנת הלימודים.",
    owner: "הבית",
    category: "חינוך",
    documentType: "אישור",
    date: "2026-07-15",
    status: "open",
    attachments: [],
  },
];

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function getInitialForm(): DocumentForm {
  return {
    title: "",
    description: "",
    owner: "הבית",
    category: "מסמכים",
    documentType: "כללי",
    date: getTodayDate(),
    expiryDate: "",
    reminderDate: "",
    tagsText: "",
    files: [],
  };
}

function getFormFromDocument(documentItem: DocumentItem): DocumentForm {
  return {
    title: documentItem.title,
    description: documentItem.description,
    owner: documentItem.owner,
    category: documentItem.category,
    documentType: documentItem.documentType ?? "כללי",
    date: documentItem.date,
    expiryDate: documentItem.expiryDate ?? "",
    reminderDate: documentItem.reminderDate ?? "",
    tagsText: documentItem.tags?.join(", ") ?? "",
    files: [],
  };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} בייט`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function getTagsFromText(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getReminderStatus(documentItem: DocumentItem) {
  if (!documentItem.reminderDate) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reminderDate = new Date(documentItem.reminderDate);
  reminderDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return "תזכורת עברה";
  }

  if (diffDays === 0) {
    return "תזכורת להיום";
  }

  return `תזכורת בעוד ${diffDays} ימים`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function fileToAttachment(
  file: File,
  source: Attachment["source"] = "upload"
): Promise<Attachment> {
  const id = crypto.randomUUID();
  const dataUrl = await readFileAsDataUrl(file);
  const metadata: Attachment = {
    id,
    name: file.name,
    size: file.size,
    type: file.type || "לא ידוע",
    source,
  };

  try {
    await saveAttachmentData(id, dataUrl);
    return metadata;
  } catch {
    // IndexedDB לא זמין — נופלים לשמירה בתוך הרשומה כמו פעם.
    return { ...metadata, dataUrl };
  }
}

async function resolveAttachmentDataUrl(file: Attachment) {
  if (file.dataUrl) {
    return file.dataUrl;
  }

  if (file.id) {
    return getAttachmentData(file.id);
  }

  return null;
}

// דפדפנים חוסמים פתיחת data: ישירות — ממירים ל-blob URL זמני.
async function dataUrlToObjectUrl(dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob();
  return URL.createObjectURL(blob);
}

async function downloadAttachment(file: Attachment) {
  const dataUrl = await resolveAttachmentDataUrl(file);

  if (!dataUrl) {
    return false;
  }

  const objectUrl = await dataUrlToObjectUrl(dataUrl);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);

  return true;
}

async function openAttachment(file: Attachment) {
  const dataUrl = await resolveAttachmentDataUrl(file);

  if (!dataUrl) {
    return false;
  }

  const objectUrl = await dataUrlToObjectUrl(dataUrl);
  const openedWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);

  return Boolean(openedWindow);
}

export default function DocumentsManager() {
  const router = useRouter();
  const { confirm, toast } = useFeedback();
  const { requireAuth } = useAuthPrompt();
  const scanInputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = usePersistentArrayState<DocumentItem>(
    storageKeys.documents,
    initialDocuments
  );
  const [form, setForm] = useState<DocumentForm>(getInitialForm);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(
    null
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DocumentStatus>(
    "all"
  );
  const [smartFilter, setSmartFilter] = useState<SmartDocumentFilter>("all");
  const [showAllDocuments, setShowAllDocuments] = useState(false);
  const [relationsDocumentId, setRelationsDocumentId] = useState<string | null>(
    null
  );
  const [aiSuggestion, setAiSuggestion] = useState<ReturnType<
    typeof suggestDocumentClassification
  > | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasMigratedAttachmentsRef = useRef(false);

  // הגירה חד-פעמית: קבצים ששמורים בתוך localStorage עוברים ל-IndexedDB,
  // ומשחררים את מכסת האחסון של הדפדפן.
  useEffect(() => {
    const needsMigration = documents.some((item) =>
      item.attachments.some((file) => file.dataUrl)
    );

    if (!needsMigration || hasMigratedAttachmentsRef.current) {
      return;
    }

    hasMigratedAttachmentsRef.current = true;

    let isActive = true;

    (async () => {
      const migratedIds = new Map<string, Attachment[]>();

      for (const item of documents) {
        if (!item.attachments.some((file) => file.dataUrl)) {
          continue;
        }

        const migratedAttachments: Attachment[] = [];

        for (const file of item.attachments) {
          if (!file.dataUrl) {
            migratedAttachments.push(file);
            continue;
          }

          const id = file.id ?? crypto.randomUUID();

          try {
            await saveAttachmentData(id, file.dataUrl);
            migratedAttachments.push({ ...file, id, dataUrl: undefined });
          } catch {
            migratedAttachments.push(file);
          }
        }

        migratedIds.set(item.id, migratedAttachments);
      }

      if (isActive && migratedIds.size > 0) {
        setDocuments((currentDocuments) =>
          currentDocuments.map((item) =>
            migratedIds.has(item.id)
              ? { ...item, attachments: migratedIds.get(item.id) as Attachment[] }
              : item
          )
        );
      }
    })();

    return () => {
      isActive = false;
    };
  }, [documents, setDocuments]);

  const smartDocumentViews = useMemo(
    () => documents.map((item) => toSmartDocumentView(item)),
    [documents]
  );

  const visibleDocumentViews = useMemo(() => {
    return smartDocumentViews
      .filter(
        (view) =>
          statusFilter === "all" || view.item.status === statusFilter
      )
      .filter((view) => matchesSmartDocumentFilter(view, smartFilter))
      .filter((view) => matchesSmartDocumentSearch(view, searchValue))
      .sort((a, b) => {
        if (a.needsReview !== b.needsReview) {
          return a.needsReview ? -1 : 1;
        }

        if (a.isExpiringSoon !== b.isExpiringSoon) {
          return a.isExpiringSoon ? -1 : 1;
        }

        return a.item.date.localeCompare(b.item.date);
      });
  }, [searchValue, smartDocumentViews, smartFilter, statusFilter]);

  const openCount = documents.filter((item) => item.status === "open").length;
  const doneCount = documents.filter((item) => item.status === "done").length;
  const attachmentsCount = documents.reduce(
    (count, item) => count + item.attachments.length,
    0
  );
  const reminderCount = documents.filter(
    (item) => item.reminderDate && getReminderStatus(item)
  ).length;
  const smartStats = getSmartDocumentStats(smartDocumentViews);
  const expiringDocumentViews = getExpiringSmartDocuments(smartDocumentViews);
  const displayedDocuments = showAllDocuments
    ? visibleDocumentViews
    : visibleDocumentViews.slice(0, 5);

  function resetForm() {
    setForm(getInitialForm());
    setAiSuggestion(null);
    setEditingDocumentId(null);
  }

  function applySuggestionToForm(suggestion: DocumentAiSuggestion) {
    setAiSuggestion(suggestion);
    setForm((currentForm) => ({
      ...currentForm,
      title: currentForm.title.trim() ? currentForm.title : suggestion.title,
      category:
        currentForm.category === "מסמכים"
          ? suggestion.category
          : currentForm.category,
      description: currentForm.description.trim()
        ? currentForm.description
        : suggestion.summary,
      tagsText: currentForm.tagsText.trim()
        ? currentForm.tagsText
        : suggestion.tags.join(", "),
    }));
  }

  async function runSmartAnalysis(files: File[]) {
    if (isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    const startedAt = performance.now();

    try {
      const suggestion = await analyzeDocumentSmart({
        title: form.title,
        description: form.description,
        files,
      });

      applySuggestionToForm(suggestion);
      trackPerformanceMetric(
        "document_ai_duration",
        performance.now() - startedAt,
        "documents"
      );
      trackTelemetryEvent({
        name: "document_ai_completed",
        module: "documents",
        properties: {
          mode: suggestion.analysis.mode,
          confidenceBucket:
            suggestion.confidence >= 0.8
              ? "high"
              : suggestion.confidence >= 0.55
                ? "medium"
                : "low",
        },
      });
      toast({
        title:
          suggestion.analysis.mode === "live"
            ? "ניתוח AI הושלם"
            : "ניתוח בסיסי הושלם",
        description: `${suggestion.analysis.extracted.documentType} · קטגוריה: ${suggestion.category}`,
        tone: suggestion.analysis.mode === "live" ? "success" : "info",
      });
    } catch (error) {
      if (error instanceof Error && error.message === "invalid-access-code") {
        trackTelemetryError("document-ai-access-code", error, "documents");
        toast({
          title: "קוד הגישה ל-AI שגוי",
          description: "אפשר לעדכן את הקוד המשפחתי בעמוד ההגדרות.",
          tone: "danger",
        });
      } else {
        trackTelemetryError("document-ai", error, "documents");
        trackTelemetryEvent({
          name: "document_ai_failed",
          module: "documents",
        });
        toast({
          title: "הניתוח נכשל",
          description: "נסו שוב בעוד רגע.",
          tone: "warning",
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  }

  function addFiles(files: File[], source: Attachment["source"] = "upload") {
    const acceptedFiles = files.filter((file) => file.size <= maxLocalFileSize);
    const rejectedCount = files.length - acceptedFiles.length;

    if (rejectedCount > 0) {
      toast({
        title: "חלק מהקבצים גדולים מדי",
        description: "בשלב המקומי אפשר לשמור קבצים עד 4MB לקובץ.",
        tone: "warning",
      });
    }

    const nextFiles = [...form.files, ...acceptedFiles];
    const suggestion = suggestDocumentClassification({
      title: form.title,
      description: form.description,
      files: nextFiles.map((file) => ({
        name: file.name,
        type: file.type || "לא ידוע",
      })),
    });

    setAiSuggestion(suggestion);
    setForm((currentForm) => ({
      ...currentForm,
      files: nextFiles,
      title: currentForm.title.trim() ? currentForm.title : suggestion.title,
      category:
        currentForm.category === "מסמכים"
          ? suggestion.category
          : currentForm.category,
      description: currentForm.description.trim()
        ? currentForm.description
        : suggestion.summary,
      tagsText: currentForm.tagsText.trim()
        ? currentForm.tagsText
        : suggestion.tags.join(", "),
    }));

    if (source === "scan" && acceptedFiles.length > 0) {
      trackTelemetryEvent({
        name: "document_uploaded",
        module: "documents",
        properties: { source: "scan", fileCount: acceptedFiles.length },
      });
      toast({
        title: "הסריקה צורפה",
        description: "מריצים ניתוח חכם…",
        tone: "success",
      });
    } else if (acceptedFiles.length > 0) {
      trackTelemetryEvent({
        name: "document_uploaded",
        module: "documents",
        properties: { source: "upload", fileCount: acceptedFiles.length },
      });
      toast({
        title: "הקובץ צורף",
        description: "מריצים ניתוח חכם…",
        tone: "info",
      });
    }

    // ניתוח מלא (AI אמיתי כשמוגדר) רץ ברקע ומעדכן את ההצעה כשהוא מסתיים.
    if (acceptedFiles.length > 0) {
      void runSmartAnalysis(nextFiles);
    }
  }

  function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>,
    source: Attachment["source"] = "upload"
  ) {
    if (
      !requireAuth({
        reason:
          source === "scan"
            ? "סריקת מסמכים דורשת מרחב מאובטח כדי לשמור קבצים רגישים."
            : "העלאת מסמכים דורשת מרחב מאובטח כדי לשמור קבצים רגישים.",
      })
    ) {
      event.target.value = "";
      return;
    }

    addFiles(Array.from(event.target.files ?? []), source);
    event.target.value = "";
  }

  // פעולה מוצעת מהניתוח: פותחת טופס ממולא מראש במודול היעד — לאישור המשתמש.
  function handleSuggestedAction(actionType: string) {
    const extracted = aiSuggestion?.analysis.extracted;

    if (!extracted) {
      return;
    }

    if (actionType === "add-finance-expense") {
      setFinanceDraft({
        title: extracted.providerName
          ? `${extracted.documentType} — ${extracted.providerName}`
          : extracted.documentType,
        category: extracted.suggestedCategory,
        amount: extracted.amount,
        date: extracted.dueDate || extracted.issueDate,
        reminderDate: extracted.dueDate,
      });
      router.push("/finance");
      return;
    }

    if (
      actionType === "create-payment-task" ||
      actionType === "create-reminder"
    ) {
      setTaskDraft({
        title: extracted.amount
          ? `לשלם: ${extracted.documentType} (${extracted.amount.toLocaleString("he-IL")} ₪)`
          : `לטפל: ${extracted.documentType}`,
        description: extracted.summary,
        dueDate: extracted.dueDate,
      });
      router.push("/tasks");
    }
  }

  async function handleSmartFiling() {
    if (
      !requireAuth({
        reason: "תיוק חכם וניתוח מסמכים דורשים מרחב מאובטח.",
      })
    ) {
      return;
    }

    await runSmartAnalysis(form.files);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // מניעת שמירה כפולה בזמן שהקבצים נקראים ונשמרים.
    if (isSubmitting) {
      return;
    }

    const cleanTitle = form.title.trim();
    const cleanDescription = form.description.trim();
    const cleanOwner = form.owner.trim();
    const cleanCategory = form.category.trim();
    const cleanDocumentType = form.documentType.trim();

    if (!cleanTitle || !cleanOwner || !cleanCategory || !form.date) {
      toast({
        title: "חסרים פרטים לשמירה",
        description: "מלאו שם מסמך, אחראי, קטגוריה ותאריך.",
        tone: "warning",
      });
      return;
    }

    setIsSubmitting(true);

    try {
    const newAttachments = await Promise.all(
      form.files.map((file) => fileToAttachment(file))
    );
    const suggestion =
      aiSuggestion ??
      suggestDocumentClassification({
        title: cleanTitle,
        description: cleanDescription,
        files: form.files.map((file) => ({
          name: file.name,
          type: file.type || "לא ידוע",
        })),
      });

    const documentPayload = {
      title: cleanTitle,
      description: cleanDescription || "מסמך חדש ללא פירוט נוסף.",
      owner: cleanOwner,
      category: cleanCategory,
      documentType: cleanDocumentType || "כללי",
      date: form.date,
      expiryDate: form.expiryDate || undefined,
      reminderDate: form.reminderDate || undefined,
      tags: getTagsFromText(form.tagsText).length
        ? getTagsFromText(form.tagsText)
        : suggestion.tags,
      aiSummary: suggestion.summary,
      aiConfidence: suggestion.confidence,
    };

    if (editingDocumentId) {
      setDocuments((currentDocuments) =>
        currentDocuments.map((item) =>
          item.id === editingDocumentId
            ? {
                ...item,
                ...documentPayload,
                attachments: [...item.attachments, ...newAttachments],
              }
            : item
        )
      );
      markFirstUsefulAction("document_reviewed", "documents");
      trackTelemetryEvent({
        name: "document_reviewed",
        module: "documents",
        properties: {
          mode: suggestion.analysis.mode,
          hasAttachments: newAttachments.length > 0,
          hasReminder: Boolean(documentPayload.reminderDate),
        },
      });
      resetForm();
      setIsFormOpen(false);
      toast({
        title: "המסמך עודכן",
        description: cleanTitle,
        tone: "success",
      });
      return;
    }

    const documentItem: DocumentItem = {
      id: crypto.randomUUID(),
      ...documentPayload,
      status: "open",
      attachments: newAttachments,
    };

    setDocuments((currentDocuments) => [documentItem, ...currentDocuments]);
    markFirstUsefulAction("document_reviewed", "documents");
    trackTelemetryEvent({
      name: "document_reviewed",
      module: "documents",
      properties: {
        mode: suggestion.analysis.mode,
        hasAttachments: newAttachments.length > 0,
        hasReminder: Boolean(documentPayload.reminderDate),
      },
    });
    resetForm();
    setIsFormOpen(false);
    toast({
      title: "מסמך חדש נוסף",
      description: documentItem.title,
      tone: "success",
    });
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleStatus(id: string) {
    setDocuments((currentDocuments) =>
      currentDocuments.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "done" ? "open" : "done" }
          : item
      )
    );
  }

  function startEditDocument(documentItem: DocumentItem) {
    setEditingDocumentId(documentItem.id);
    setForm(getFormFromDocument(documentItem));
    setAiSuggestion(null);
    setIsFormOpen(true);
  }

  function cancelEditDocument() {
    resetForm();
    setIsFormOpen(false);
  }

  async function deleteDocument(id: string) {
    const documentItem = documents.find((item) => item.id === id);
    const title = documentItem?.title ?? "המסמך הזה";
    const approved = await confirm({
      title: "מחיקת מסמך",
      description: `למחוק את "${title}"? אי אפשר לשחזר את הרשומה אחרי המחיקה.`,
      confirmLabel: "מחק מסמך",
      cancelLabel: "ביטול",
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    setDocuments((currentDocuments) =>
      currentDocuments.filter((item) => item.id !== id)
    );

    // מפנים גם את הקבצים מ-IndexedDB.
    const attachmentIds = (documentItem?.attachments ?? [])
      .map((file) => file.id)
      .filter((fileId): fileId is string => Boolean(fileId));
    void deleteAttachmentData(attachmentIds);

    if (editingDocumentId === id) {
      resetForm();
      setIsFormOpen(false);
    }
    toast({
      title: "המסמך נמחק",
      description: title,
      tone: "info",
    });
  }

  async function removeAttachment(documentId: string, attachment: Attachment) {
    const approved = await confirm({
      title: "הסרת קובץ מצורף",
      description: `להסיר את "${attachment.name}" מהמסמך? הקובץ יימחק מהמכשיר.`,
      confirmLabel: "הסר קובץ",
      cancelLabel: "ביטול",
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    setDocuments((currentDocuments) =>
      currentDocuments.map((item) =>
        item.id === documentId
          ? {
              ...item,
              attachments: item.attachments.filter(
                (file) => file !== attachment
              ),
            }
          : item
      )
    );

    if (attachment.id) {
      void deleteAttachmentData([attachment.id]);
    }

    toast({
      title: "הקובץ הוסר",
      description: attachment.name,
      tone: "info",
    });
  }

  return (
    <section className="space-y-2.5 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1rem)] lg:pb-0">
      <div className="rounded-[22px] border border-white/80 bg-white/90 p-4 text-right shadow-[0_14px_34px_rgba(33,43,63,0.06)] ring-1 ring-[#eadfcd]/60">
        <p className="text-xs font-black text-[#7a5212]">
          מרכז מסמכים חכם
        </p>
        <h1 className="mt-1 text-2xl font-black text-[#111827]">
          כל מסמך חשוב במקום אחד
        </h1>
        <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
          מסמכים מקבלים תוקף, תזכורות, קישורים לכספים/בריאות/רכבים וסיכום חכם
          לבדיקה לפני שמירה.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="nestly-card rounded-[16px] p-3 text-right">
          <p className="truncate text-[11px] font-bold text-slate-600">מסמכים</p>
          <p className="mt-0.5 text-lg font-black">{smartStats.total}</p>
        </div>
        <div className="nestly-card rounded-[16px] p-3 text-right">
          <p className="truncate text-[11px] font-bold text-slate-600">
            דורשים בדיקה
          </p>
          <p className="mt-0.5 text-lg font-black">{smartStats.needsReview}</p>
        </div>
        <div className="nestly-card rounded-[16px] p-3 text-right">
          <p className="truncate text-[11px] font-bold text-slate-600">
            תוקף קרוב
          </p>
          <p className="mt-0.5 text-lg font-black">{smartStats.expiringSoon}</p>
        </div>
        <div className="nestly-card rounded-[16px] p-3 text-right">
          <p className="truncate text-[11px] font-bold text-slate-600">
            מקושרים
          </p>
          <p className="mt-0.5 text-lg font-black">{smartStats.linked}</p>
        </div>
      </div>

      <div className="hidden">
        {attachmentsCount}
        {openCount}
        {doneCount}
        {reminderCount}
      </div>

      {expiringDocumentViews.length > 0 && (
        <section className="rounded-[20px] border border-orange-100 bg-orange-50/70 p-3 text-right">
          <p className="text-xs font-black text-orange-700">
            מסמכים שתוקפם מתקרב
          </p>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            {expiringDocumentViews.map((view) => (
              <article
                key={view.item.id}
                className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-orange-100"
              >
                <p className="truncate text-sm font-black text-[#111827]">
                  {view.item.title}
                </p>
                <p className="mt-1 text-xs font-semibold text-orange-700">
                  {view.daysUntilExpiry === 0
                    ? "פג היום"
                    : `בעוד ${view.daysUntilExpiry} ימים`}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="hidden">
        <div className="nestly-card rounded-[16px] p-2.5 text-right">
          <p className="truncate text-[11px] font-bold text-slate-600">
            פתוחים / בוצעו
          </p>
          <p className="mt-0.5 text-lg font-black">
            {openCount}/{doneCount}
          </p>
        </div>
        <div className="nestly-card rounded-[16px] p-2.5 text-right">
          <p className="truncate text-[11px] font-bold text-slate-600">תזכורות</p>
          <p className="mt-0.5 text-lg font-black">{reminderCount}</p>
        </div>
      </div>

      <details
        open={isFormOpen}
        onToggle={(event) => setIsFormOpen(event.currentTarget.open)}
        className="nestly-card group rounded-[18px] p-3 text-right text-[#111827]"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <span className="rounded-full bg-[#f4e7c8] px-4 py-2 text-xs font-black text-slate-950 shadow-sm group-open:hidden">
            {editingDocumentId ? "עריכת מסמך" : "הוסף מסמך"}
          </span>
          <span className="hidden rounded-full border border-[#eadfcd] bg-[#fff8eb] px-4 py-2 text-xs font-black text-[#7a5212] group-open:inline">
            סגור
          </span>
          <div>
          <p className="mb-1 text-[11px] font-bold text-slate-600">צירוף מסמכים</p>
            <h2 className="text-base font-black">
              {editingDocumentId ? "עריכת מסמך" : "הוספת מסמך"}
            </h2>
          </div>
          <p className="hidden">
            אפשר לצרף קבצים, לפתוח מצלמה לסריקה מהטלפון, ולהפעיל תיוק חכם
            שמציע קטגוריה ותגיות. בשלב הזה הקבצים נשמרים מקומית בדפדפן.
          </p>
          <p className="hidden">
            מצב AI: {documentAiStatus.description}
          </p>
        </summary>

        <form onSubmit={handleSubmit} className="mt-2.5 grid gap-2.5 lg:grid-cols-6">
          <input
            value={form.title}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                title: event.target.value,
              }))
            }
            required
            className="rounded-2xl border border-[#e6e8ec] bg-[#fffdf8] px-4 py-3 text-right text-[#111827] outline-none placeholder:text-slate-500 lg:col-span-2"
            placeholder="שם המסמך"
          />

          <input
            value={form.owner}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                owner: event.target.value,
              }))
            }
            required
            className="rounded-2xl border border-[#e6e8ec] bg-[#fffdf8] px-4 py-3 text-right text-[#111827] outline-none placeholder:text-slate-500"
            placeholder="אחראי"
          />

          <input
            value={form.category}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                category: event.target.value,
              }))
            }
            required
            className="rounded-2xl border border-[#e6e8ec] bg-[#fffdf8] px-4 py-3 text-right text-[#111827] outline-none placeholder:text-slate-500"
            placeholder="קטגוריה"
          />

          <input
            value={form.documentType}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                documentType: event.target.value,
              }))
            }
            className="rounded-2xl border border-[#e6e8ec] bg-[#fffdf8] px-4 py-3 text-right text-[#111827] outline-none placeholder:text-slate-500"
            placeholder="סוג מסמך"
          />

          <DateInput
            value={form.date}
            onChange={(date) =>
              setForm((currentForm) => ({
                ...currentForm,
                date,
              }))
            }
            required
            label="תאריך מסמך"
            inputClassName="min-h-12 w-full rounded-2xl border border-[#e6e8ec] bg-[#fffdf8] px-4 py-3 text-right text-[#111827] outline-none placeholder:text-slate-500"
            buttonClassName="min-h-12 rounded-2xl border border-[#e6e8ec] bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-[#fff8eb]"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-[#007aff] px-5 py-3 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,122,255,0.18)] hover:bg-[#0065d1] disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting
              ? "שומר…"
              : editingDocumentId
                ? "שמור שינויים"
                : "שמור מסמך"}
          </button>

          {editingDocumentId && (
            <button
              type="button"
              onClick={cancelEditDocument}
              className="rounded-2xl border border-[#e6e8ec] bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-[#fff8eb]"
            >
              ביטול עריכה
            </button>
          )}

          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                description: event.target.value,
              }))
            }
            className="min-h-14 resize-y rounded-2xl border border-[#e6e8ec] bg-[#fffdf8] px-4 py-3 text-right text-[#111827] outline-none placeholder:text-slate-500 lg:col-span-2"
            placeholder="פירוט קצר"
          />

          <DateInput
            value={form.expiryDate}
            onChange={(expiryDate) =>
              setForm((currentForm) => ({
                ...currentForm,
                expiryDate,
              }))
            }
            ariaLabel="תאריך תוקף"
            inputClassName="min-h-12 w-full rounded-2xl border border-[#e6e8ec] bg-[#fffdf8] px-4 py-3 text-right text-[#111827] outline-none placeholder:text-slate-500"
            buttonClassName="min-h-12 rounded-2xl border border-[#e6e8ec] bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-[#fff8eb]"
          />

          <DateInput
            value={form.reminderDate}
            onChange={(reminderDate) =>
              setForm((currentForm) => ({
                ...currentForm,
                reminderDate,
              }))
            }
            ariaLabel="תאריך תזכורת"
            inputClassName="min-h-12 w-full rounded-2xl border border-[#e6e8ec] bg-[#fffdf8] px-4 py-3 text-right text-[#111827] outline-none placeholder:text-slate-500"
            buttonClassName="min-h-12 rounded-2xl border border-[#e6e8ec] bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-[#fff8eb]"
          />

          <input
            value={form.tagsText}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                tagsText: event.target.value,
              }))
            }
            className="rounded-2xl border border-[#e6e8ec] bg-[#fffdf8] px-4 py-3 text-right text-[#111827] outline-none placeholder:text-slate-500 lg:col-span-2"
            placeholder="תגיות, מופרדות בפסיקים"
          />

          <div className="grid gap-2.5 lg:col-span-3">
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleSmartFiling}
                disabled={isAnalyzing}
                className="rounded-2xl border border-[#d8b470]/55 bg-[#fff8eb] px-4 py-2 text-sm font-black text-[#7a5212] hover:bg-[#fff3d6] disabled:cursor-wait disabled:opacity-60"
              >
                {isAnalyzing ? "מנתח…" : "תיוק חכם"}
              </button>
              <button
                type="button"
                onClick={() => scanInputRef.current?.click()}
                className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800"
              >
                סריקה מהמצלמה
              </button>
            </div>

            <label className="rounded-2xl border border-dashed border-[#d8b470] bg-[#fff8eb] p-3 text-right text-sm font-bold text-slate-700">
              צירוף קבצים
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                onChange={(event) => handleFileSelection(event, "upload")}
                className="mt-2 block w-full text-sm text-slate-700"
              />
              {form.files.length > 0 && (
                <span className="mt-2 block text-xs text-slate-600">
                  נבחרו {form.files.length} קבצים
                </span>
              )}
            </label>

            <input
              type="file"
              ref={scanInputRef}
              accept="image/*"
              capture="environment"
              multiple
              onChange={(event) => handleFileSelection(event, "scan")}
              className="hidden"
            />

            {aiSuggestion && (
              <div className="rounded-2xl border border-[#d8b470]/35 bg-[#fff8eb] p-3 text-right text-sm text-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-[#111827] px-3 py-1 text-[11px] font-black text-white">
                    Mock AI · אין שמירה אוטומטית
                  </span>
                  <p className="font-black">סקירת ניתוח לפני אישור</p>
                </div>
                <p className="mt-2 leading-6">
                  {aiSuggestion.summary} רמת ביטחון:{" "}
                  {Math.round(aiSuggestion.confidence * 100)}%
                </p>
                <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <span className="rounded-xl bg-white px-3 py-2 text-slate-700">
                    סוג: {aiSuggestion.analysis.extracted.documentType}
                  </span>
                  <span className="rounded-xl bg-white px-3 py-2 text-slate-700">
                    ספק: {aiSuggestion.analysis.extracted.providerName ?? "לא זוהה"}
                  </span>
                  <span className="rounded-xl bg-white px-3 py-2 text-slate-700">
                    סכום:{" "}
                    {typeof aiSuggestion.analysis.extracted.amount === "number"
                      ? `${aiSuggestion.analysis.extracted.amount.toLocaleString(
                          "he-IL"
                        )} ${aiSuggestion.analysis.extracted.currency ?? "ILS"}`
                      : "לא זוהה"}
                  </span>
                  <span className="rounded-xl bg-white px-3 py-2 text-slate-700">
                    לתשלום עד: {aiSuggestion.analysis.extracted.dueDate ?? "לא זוהה"}
                  </span>
                  <span className="rounded-xl bg-white px-3 py-2 text-slate-700">
                    אסמכתא:{" "}
                    {aiSuggestion.analysis.extracted.referenceNumber ??
                      aiSuggestion.analysis.extracted.accountNumber ??
                      "לא זוהתה"}
                  </span>
                  <span className="rounded-xl bg-white px-3 py-2 text-slate-700">
                    תקופה: {aiSuggestion.analysis.extracted.billingPeriod ?? "לא זוהתה"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {aiSuggestion.analysis.suggestedActions.map((action) => (
                    action.type === "add-finance-expense" ||
                    action.type === "create-payment-task" ||
                    action.type === "create-reminder" ? (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => handleSuggestedAction(action.type)}
                        title={action.description}
                        className="rounded-full bg-[#111827] px-3 py-1 text-xs font-black text-white transition hover:bg-[#1f2937]"
                      >
                        {action.label} ←
                      </button>
                    ) : (
                      <span
                        key={action.id}
                        className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700"
                      >
                        {action.label}
                      </span>
                    )
                  ))}
                </div>
                <p className="mt-2 text-xs font-bold">
                  תגיות: {aiSuggestion.tags.join(", ")}
                </p>
              </div>
            )}
          </div>
        </form>
      </details>

      <section className="nestly-card rounded-[18px] p-3 text-right text-[#111827]">
        <div className="mb-2.5 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={() => {
              setSearchValue("");
              setStatusFilter("all");
              setSmartFilter("all");
            }}
            className="w-fit rounded-xl border border-[#e6e8ec] bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-[#fff8eb]"
          >
            נקה סינון
          </button>

          <div>
            <p className="mb-0.5 text-xs font-bold text-slate-600">
              {visibleDocumentViews.length} מסמכים מוצגים
            </p>
            <h2 className="text-base font-black">מסמכים חכמים</h2>
          </div>
        </div>

        <div className="mb-2.5 flex gap-2 overflow-x-auto pb-1">
          {smartDocumentFilters.map((filter) => {
            const isActive = smartFilter === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSmartFilter(filter.id)}
                className={[
                  "min-h-10 shrink-0 rounded-full px-3 text-xs font-black transition",
                  isActive
                    ? "bg-[#111827] text-white"
                    : "border border-[#e6e8ec] bg-white text-slate-700 hover:bg-[#fff8eb]",
                ].join(" ")}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="mb-2.5 grid gap-2.5 md:grid-cols-2">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="rounded-2xl border border-[#e6e8ec] bg-[#fffdf8] px-4 py-3 text-right text-[#111827] outline-none placeholder:text-slate-500"
            placeholder="חיפוש לפי שם, קטגוריה, אדם, רכב, תגית או מטא־דאטה"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | DocumentStatus)
            }
            className="rounded-2xl border border-[#e6e8ec] bg-[#fffdf8] px-4 py-3 text-right text-[#111827] outline-none"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="open">פתוחים בלבד</option>
            <option value="done">בוצעו בלבד</option>
          </select>
        </div>

        {visibleDocumentViews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8b470] bg-[#fff8eb] p-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl">
              📄
            </div>
            <p className="mt-3 text-base font-black text-[#111827]">
              מרכז המסמכים מוכן לקובץ הראשון
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm font-semibold leading-6 text-slate-600">
              העלה חשבון, פוליסה או צילום מסמך, ו-Nestly יכין סקירה לבדיקה לפני שמירה.
            </p>
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="mt-4 min-h-11 rounded-2xl bg-[#007aff] px-4 text-sm font-black text-white shadow-[0_10px_24px_rgba(0,122,255,0.16)]"
            >
              העלה או סרוק מסמך
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedDocuments.map((item) => (
              (() => {
                const view = item;
                const documentItem = view.item as DocumentItem;

                return (
              <article
                key={documentItem.id}
                className="rounded-2xl border border-[#eadfcd] bg-white p-3 text-right"
              >
                <div className="flex flex-col gap-2.5 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleStatus(documentItem.id)}
                      className={
                        documentItem.status === "done"
                          ? "rounded-xl bg-[#111827] px-4 py-2 text-sm font-bold text-white hover:bg-[#1f2937]"
                          : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100"
                      }
                    >
                      {documentItem.status === "done" ? "פתח מחדש" : "סמן כבוצע"}
                    </button>

                    <button
                      type="button"
                      onClick={() => startEditDocument(documentItem)}
                      className="rounded-xl border border-[#e6e8ec] bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-[#fff8eb]"
                    >
                      עריכה
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteDocument(documentItem.id)}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-100"
                    >
                      מחיקה
                    </button>
                  </div>

                  <div className="max-w-3xl">
                    <div className="mb-2 flex flex-wrap justify-end gap-2 text-xs font-bold">
                      <span
                        className={`rounded-full px-3 py-1 ring-1 ${view.statusToneClass}`}
                      >
                        {view.statusLabel}
                      </span>
                      <span className="rounded-full bg-[#fff8eb] px-3 py-1 text-slate-700">
                        {view.typeLabel}
                      </span>
                      {documentItem.documentType && (
                        <span className="rounded-full bg-[#fff8eb] px-3 py-1 text-slate-700">
                          {documentItem.documentType}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-[#111827]">
                      {documentItem.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-sm leading-6 text-slate-600">
                      {view.summary}
                    </p>
                    <p className="mt-2 text-xs font-bold text-slate-600">
                      אחראי: {documentItem.owner} | תאריך:{" "}
                      {formatDate(documentItem.date)}
                    </p>

                    {(documentItem.expiryDate || documentItem.reminderDate) && (
                      <p className="mt-2 text-xs font-bold text-slate-600">
                        {documentItem.expiryDate
                          ? `תוקף: ${formatDate(documentItem.expiryDate)}`
                          : ""}
                        {documentItem.expiryDate && documentItem.reminderDate
                          ? " | "
                          : ""}
                        {documentItem.reminderDate
                          ? getReminderStatus(documentItem)
                          : ""}
                      </p>
                    )}

                    {view.linkedModules.length > 0 && (
                      <div className="mt-2 flex flex-wrap justify-end gap-2">
                        {view.linkedModules.map((link) => (
                          <a
                            key={`${documentItem.id}-${link.href}-${link.label}`}
                            href={link.href}
                            className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-100"
                            title={link.description}
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    )}

                    {(documentItem.tags?.length ?? 0) > 0 && (
                      <div className="mt-2 flex flex-wrap justify-end gap-2">
                        {documentItem.tags?.map((tag) => (
                          <span
                            key={`${documentItem.id}-${tag}`}
                            className="rounded-full bg-[#fff8eb] px-3 py-1 text-xs font-bold text-slate-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {view.extractedMetadata.length > 0 && (
                      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                        {view.extractedMetadata.slice(0, 4).map((entry) => (
                          <span
                            key={`${documentItem.id}-${entry.label}`}
                            className="rounded-xl bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-slate-600"
                          >
                            <span className="font-black text-slate-700">
                              {entry.label}:
                            </span>{" "}
                            {entry.value}
                          </span>
                        ))}
                      </div>
                    )}

                    {documentItem.aiSummary && (
                      <p className="mt-2 rounded-xl bg-[#fff8eb] px-3 py-2 text-sm leading-6 text-slate-700">
                        תיוק חכם: {documentItem.aiSummary}
                      </p>
                    )}

                    {documentItem.attachments.length > 0 && (
                      <div className="mt-2.5 space-y-1.5">
                        {documentItem.attachments.map((file, fileIndex) => (
                          <div
                            key={file.id ?? `${documentItem.id}-${file.name}-${fileIndex}`}
                            className="flex flex-col gap-2 rounded-xl bg-[#fffdf8] px-3 py-2 text-sm text-slate-700 md:flex-row md:items-center md:justify-between"
                          >
                            <div>
                              <span className="font-bold text-[#111827]">
                                {file.name}
                              </span>{" "}
                              · {formatFileSize(file.size)} · {file.type}
                              {file.source === "scan" ? " · סריקה" : ""}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!(await openAttachment(file))) {
                                    toast({
                                      title: "אין תצוגה זמינה",
                                      description:
                                        "הקובץ נשמר לפני שנוספה שמירת תוכן מקומית.",
                                      tone: "warning",
                                    });
                                  }
                                }}
                                className="rounded-xl border border-[#e6e8ec] bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-[#fff8eb]"
                              >
                                תצוגה
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!(await downloadAttachment(file))) {
                                    toast({
                                      title: "אין קובץ להורדה",
                                      description:
                                        "הקובץ נשמר לפני שנוספה שמירת תוכן מקומית.",
                                      tone: "warning",
                                    });
                                  }
                                }}
                                className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
                              >
                                הורדה
                              </button>
                              <button
                                type="button"
                                onClick={() => removeAttachment(documentItem.id, file)}
                                className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                              >
                                הסרה
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() =>
                          setRelationsDocumentId((currentValue) =>
                            currentValue === documentItem.id
                              ? null
                              : documentItem.id
                          )
                        }
                        className="min-h-10 rounded-2xl border border-[#e6e8ec] bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-[#fff8eb]"
                      >
                        {relationsDocumentId === documentItem.id
                          ? "הסתר פריטים קשורים"
                          : "פריטים קשורים"}
                      </button>
                      {relationsDocumentId === documentItem.id ? (
                        <div className="mt-2 grid gap-2">
                          <SuggestedConnectionsPanel
                            entity={{
                              entityType: "document",
                              entityId: documentItem.id,
                            }}
                          />
                          <RelatedItemsPanel
                            entity={{
                              entityType: "document",
                              entityId: documentItem.id,
                            }}
                            compact
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
                );
              })()
            ))}
            {visibleDocumentViews.length > 5 && (
              <button
                type="button"
                onClick={() =>
                  setShowAllDocuments((currentValue) => !currentValue)
                }
                className="w-full rounded-2xl border border-[#e6e8ec] bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-[#fff8eb]"
              >
                {showAllDocuments
                  ? "הצג פחות"
                  : `הצג עוד ${visibleDocumentViews.length - 5}`}
              </button>
            )}
          </div>
        )}
      </section>
    </section>
  );
}
