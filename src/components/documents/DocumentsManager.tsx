"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import DateInput from "@/components/ui/DateInput";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { storageKeys } from "@/lib/storageKeys";
import {
  documentAiStatus,
  suggestDocumentClassification,
} from "@/services/documentAi";

type DocumentStatus = "open" | "done";

type Attachment = {
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

const maxLocalFileSize = 4 * 1024 * 1024;

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
  return {
    name: file.name,
    size: file.size,
    type: file.type || "לא ידוע",
    dataUrl: await readFileAsDataUrl(file),
    source,
  };
}

function downloadAttachment(file: Attachment) {
  if (!file.dataUrl) {
    return false;
  }

  const link = document.createElement("a");
  link.href = file.dataUrl;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return true;
}

function openAttachment(file: Attachment) {
  if (!file.dataUrl) {
    return false;
  }

  window.open(file.dataUrl, "_blank", "noopener,noreferrer");
  return true;
}

export default function DocumentsManager() {
  const { confirm, toast } = useFeedback();
  const scanInputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = usePersistentArrayState<DocumentItem>(
    storageKeys.documents,
    initialDocuments
  );
  const [form, setForm] = useState<DocumentForm>(getInitialForm);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DocumentStatus>(
    "all"
  );
  const [showAllDocuments, setShowAllDocuments] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<ReturnType<
    typeof suggestDocumentClassification
  > | null>(null);

  const visibleDocuments = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return [...documents]
      .filter((item) => statusFilter === "all" || item.status === statusFilter)
      .filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          item.title.toLowerCase().includes(normalizedSearch) ||
          item.description.toLowerCase().includes(normalizedSearch) ||
          item.owner.toLowerCase().includes(normalizedSearch) ||
          item.category.toLowerCase().includes(normalizedSearch) ||
          item.date.includes(normalizedSearch) ||
          item.attachments.some((file) =>
            file.name.toLowerCase().includes(normalizedSearch)
          )
        );
      })
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "open" ? -1 : 1;
        }

        return a.date.localeCompare(b.date);
      });
  }, [documents, searchValue, statusFilter]);

  const openCount = documents.filter((item) => item.status === "open").length;
  const doneCount = documents.filter((item) => item.status === "done").length;
  const attachmentsCount = documents.reduce(
    (count, item) => count + item.attachments.length,
    0
  );
  const reminderCount = documents.filter(
    (item) => item.reminderDate && getReminderStatus(item)
  ).length;
  const displayedDocuments = showAllDocuments
    ? visibleDocuments
    : visibleDocuments.slice(0, 5);

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
      toast({
        title: "סריקה נותחה",
        description: `התמונה צורפה והוצעה קטגוריה: ${suggestion.category}`,
        tone: "success",
      });
    } else if (acceptedFiles.length > 0) {
      toast({
        title: "הקובץ נותח",
        description: `הוצעה קטגוריה: ${suggestion.category}`,
        tone: "info",
      });
    }
  }

  function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>,
    source: Attachment["source"] = "upload"
  ) {
    addFiles(Array.from(event.target.files ?? []), source);
    event.target.value = "";
  }

  function handleSmartFiling() {
    const suggestion = suggestDocumentClassification({
      title: form.title,
      description: form.description,
      files: form.files.map((file) => ({
        name: file.name,
        type: file.type || "לא ידוע",
      })),
    });

    setAiSuggestion(suggestion);
    setForm((currentForm) => ({
      ...currentForm,
      title: currentForm.title.trim() ? currentForm.title : suggestion.title,
      category: suggestion.category,
      description: currentForm.description.trim()
        ? currentForm.description
        : suggestion.summary,
    }));
    toast({
      title: "התיוק החכם הוכן",
      description: `קטגוריה מוצעת: ${suggestion.category}`,
      tone: "info",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = form.title.trim();
    const cleanDescription = form.description.trim();
    const cleanOwner = form.owner.trim();
    const cleanCategory = form.category.trim();
    const cleanDocumentType = form.documentType.trim();

    if (!cleanTitle || !cleanOwner || !cleanCategory || !form.date) {
      return;
    }

    const attachments = await Promise.all(
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

    const documentItem: DocumentItem = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      description: cleanDescription || "מסמך חדש ללא פירוט נוסף.",
      owner: cleanOwner,
      category: cleanCategory,
      documentType: cleanDocumentType || "כללי",
      date: form.date,
      expiryDate: form.expiryDate || undefined,
      reminderDate: form.reminderDate || undefined,
      status: "open",
      attachments,
      tags: getTagsFromText(form.tagsText).length
        ? getTagsFromText(form.tagsText)
        : suggestion.tags,
      aiSummary: suggestion.summary,
      aiConfidence: suggestion.confidence,
    };

    setDocuments((currentDocuments) => [documentItem, ...currentDocuments]);
    setForm(getInitialForm());
    setAiSuggestion(null);
    toast({
      title: "מסמך חדש נוסף",
      description: documentItem.title,
      tone: "success",
    });
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
    toast({
      title: "המסמך נמחק",
      description: title,
      tone: "info",
    });
  }

  return (
    <section className="space-y-2.5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-[16px] bg-slate-800/62 p-2.5 text-right shadow-[0_8px_22px_rgba(2,6,23,0.14)]">
          <p className="truncate text-[11px] text-slate-300">מסמכים</p>
          <p className="mt-0.5 text-lg font-black">{documents.length}</p>
        </div>
        <div className="rounded-[16px] bg-slate-800/62 p-2.5 text-right shadow-[0_8px_22px_rgba(2,6,23,0.14)]">
          <p className="truncate text-[11px] text-slate-300">קבצים</p>
          <p className="mt-0.5 text-lg font-black">{attachmentsCount}</p>
        </div>
        <div className="rounded-[16px] bg-slate-800/62 p-2.5 text-right shadow-[0_8px_22px_rgba(2,6,23,0.14)]">
          <p className="truncate text-[11px] text-slate-300">פתוחים / בוצעו</p>
          <p className="mt-0.5 text-lg font-black">
            {openCount}/{doneCount}
          </p>
        </div>
        <div className="rounded-[16px] bg-slate-800/62 p-2.5 text-right shadow-[0_8px_22px_rgba(2,6,23,0.14)]">
          <p className="truncate text-[11px] text-slate-300">תזכורות</p>
          <p className="mt-0.5 text-lg font-black">{reminderCount}</p>
        </div>
      </div>

      <details className="group rounded-[18px] bg-slate-800/58 p-2.5 text-right text-[#fff9ea] shadow-[0_10px_28px_rgba(2,6,23,0.16)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <span className="rounded-full bg-[#f4e7c8] px-4 py-2 text-xs font-black text-slate-950 shadow-sm group-open:hidden">
            הוסף מסמך
          </span>
          <span className="hidden rounded-full bg-white/[0.08] px-4 py-2 text-xs font-black text-slate-200 group-open:inline">
            סגור
          </span>
          <div>
          <p className="mb-1 text-[11px] text-slate-400">צירוף מסמכים</p>
            <h2 className="text-base font-black">הוספת מסמך</h2>
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
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500 lg:col-span-2"
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
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
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
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
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
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
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
            inputClassName="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-400"
            buttonClassName="min-h-12 rounded-2xl border border-white/10 bg-white/[0.08] px-3 text-xs font-black text-[#fff9ea] transition hover:bg-white/[0.12]"
          />

          <button
            type="submit"
            className="rounded-2xl bg-[#f4e7c8] px-5 py-3 text-sm font-black text-slate-950 hover:bg-[#fff3d6]"
          >
            שמור מסמך
          </button>

          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                description: event.target.value,
              }))
            }
            className="min-h-14 resize-y rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500 lg:col-span-2"
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
            inputClassName="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-400"
            buttonClassName="min-h-12 rounded-2xl border border-white/10 bg-white/[0.08] px-3 text-xs font-black text-[#fff9ea] transition hover:bg-white/[0.12]"
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
            inputClassName="min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-400"
            buttonClassName="min-h-12 rounded-2xl border border-white/10 bg-white/[0.08] px-3 text-xs font-black text-[#fff9ea] transition hover:bg-white/[0.12]"
          />

          <input
            value={form.tagsText}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                tagsText: event.target.value,
              }))
            }
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500 lg:col-span-2"
            placeholder="תגיות, מופרדות בפסיקים"
          />

          <div className="grid gap-2.5 lg:col-span-3">
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleSmartFiling}
                className="rounded-2xl bg-[#f4e7c8] px-4 py-2 text-sm font-black text-slate-950 hover:bg-[#fff3d6]"
              >
                תיוק חכם
              </button>
              <button
                type="button"
                onClick={() => scanInputRef.current?.click()}
                className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800"
              >
                סריקה מהמצלמה
              </button>
            </div>

            <label className="rounded-2xl border border-dashed border-white/15 bg-white/[0.05] p-3 text-right text-sm font-bold text-slate-200">
              צירוף קבצים
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                onChange={(event) => handleFileSelection(event, "upload")}
                className="mt-2 block w-full text-sm text-slate-300"
              />
              {form.files.length > 0 && (
                <span className="mt-2 block text-xs text-slate-400">
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
              <div className="rounded-2xl border border-[#d8b470]/20 bg-[#d8b470]/10 p-3 text-right text-sm text-[#f4e7c8]">
                <p className="font-black">הצעת תיוק חכם</p>
                <p className="mt-1">
                  {aiSuggestion.summary} רמת ביטחון:{" "}
                  {Math.round(aiSuggestion.confidence * 100)}%
                </p>
                <p className="mt-2 text-xs font-bold">
                  תגיות: {aiSuggestion.tags.join(", ")}
                </p>
              </div>
            )}
          </div>
        </form>
      </details>

      <section className="rounded-[18px] bg-slate-800/58 p-2.5 text-right text-[#fff9ea] shadow-[0_10px_28px_rgba(2,6,23,0.16)]">
        <div className="mb-2.5 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={() => {
              setSearchValue("");
              setStatusFilter("all");
            }}
            className="w-fit rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-slate-200 hover:bg-white/[0.1]"
          >
            נקה סינון
          </button>

          <div>
            <p className="mb-0.5 text-xs text-slate-400">
              {visibleDocuments.length} מסמכים מוצגים
            </p>
            <h2 className="text-base font-black">רשימת מסמכים</h2>
          </div>
        </div>

        <div className="mb-2.5 grid gap-2.5 md:grid-cols-2">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
            placeholder="חיפוש לפי שם, קטגוריה, אחראי או קובץ"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | DocumentStatus)
            }
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="open">פתוחים בלבד</option>
            <option value="done">בוצעו בלבד</option>
          </select>
        </div>

        {visibleDocuments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-8 text-center text-slate-400">
            אין מסמכים להצגה לפי הסינון הנוכחי.
          </div>
        ) : (
          <div className="space-y-2">
            {displayedDocuments.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-2.5 text-right"
              >
                <div className="flex flex-col gap-2.5 md:flex-row md:items-start md:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleStatus(item.id)}
                      className={
                        item.status === "done"
                          ? "rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                          : "rounded-xl bg-emerald-400/14 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-400/20"
                      }
                    >
                      {item.status === "done" ? "פתח מחדש" : "סמן כבוצע"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteDocument(item.id)}
                      className="rounded-xl bg-[#b86f68]/14 px-4 py-2 text-sm font-bold text-[#f0c6bd] hover:bg-[#b86f68]/20"
                    >
                      מחיקה
                    </button>
                  </div>

                  <div className="max-w-3xl">
                    <div className="mb-2 flex flex-wrap justify-end gap-2 text-xs font-bold">
                      <span className="rounded-full bg-white/[0.07] px-3 py-1 text-slate-300">
                        {item.status === "done" ? "בוצע" : "פתוח"}
                      </span>
                      <span className="rounded-full bg-white/[0.07] px-3 py-1 text-slate-300">
                        {item.category}
                      </span>
                      {item.documentType && (
                        <span className="rounded-full bg-white/[0.07] px-3 py-1 text-slate-300">
                          {item.documentType}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-white">{item.title}</h3>
                    <p className="mt-1 line-clamp-1 text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>
                    <p className="mt-2 text-xs font-bold text-slate-400">
                      אחראי: {item.owner} | תאריך: {formatDate(item.date)}
                    </p>

                    {(item.expiryDate || item.reminderDate) && (
                      <p className="mt-2 text-xs font-bold text-slate-400">
                        {item.expiryDate ? `תוקף: ${formatDate(item.expiryDate)}` : ""}
                        {item.expiryDate && item.reminderDate ? " | " : ""}
                        {item.reminderDate ? getReminderStatus(item) : ""}
                      </p>
                    )}

                    {(item.tags?.length ?? 0) > 0 && (
                      <div className="mt-2 flex flex-wrap justify-end gap-2">
                        {item.tags?.map((tag) => (
                          <span
                            key={`${item.id}-${tag}`}
                            className="rounded-full bg-white/[0.07] px-3 py-1 text-xs font-bold text-slate-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.aiSummary && (
                      <p className="mt-2 rounded-xl bg-white/[0.055] px-3 py-2 text-sm leading-6 text-slate-300">
                        תיוק חכם: {item.aiSummary}
                      </p>
                    )}

                    {item.attachments.length > 0 && (
                      <div className="mt-2.5 space-y-1.5">
                        {item.attachments.map((file) => (
                          <div
                            key={`${item.id}-${file.name}`}
                            className="flex flex-col gap-2 rounded-xl bg-white/[0.055] px-3 py-2 text-sm text-slate-300 md:flex-row md:items-center md:justify-between"
                          >
                            <div>
                              <span className="font-bold text-white">
                                {file.name}
                              </span>{" "}
                              · {formatFileSize(file.size)} · {file.type}
                              {file.source === "scan" ? " · סריקה" : ""}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!openAttachment(file)) {
                                    toast({
                                      title: "אין תצוגה זמינה",
                                      description:
                                        "הקובץ נשמר לפני שנוספה שמירת תוכן מקומית.",
                                      tone: "warning",
                                    });
                                  }
                                }}
                                className="rounded-xl bg-white/[0.08] px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/[0.12]"
                              >
                                תצוגה
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!downloadAttachment(file)) {
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
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
            {visibleDocuments.length > 5 && (
              <button
                type="button"
                onClick={() =>
                  setShowAllDocuments((currentValue) => !currentValue)
                }
                className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-[#d7cfbf] hover:bg-white/[0.09]"
              >
                {showAllDocuments
                  ? "הצג פחות"
                  : `הצג עוד ${visibleDocuments.length - 5}`}
              </button>
            )}
          </div>
        )}
      </section>
    </section>
  );
}
