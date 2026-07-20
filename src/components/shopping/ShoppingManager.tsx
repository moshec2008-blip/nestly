"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import AISuggestionCard from "@/components/ai/AISuggestionCard";
import ReceiptScanPreview from "@/components/ai/ReceiptScanPreview";
import AppIcon from "@/components/ui/AppIcon";
import { useFeedback } from "@/components/ui/FeedbackProvider";
import {
  initialFinanceTransactions,
  isFinanceTransaction,
  type FinanceTransaction,
} from "@/data/finance";
import { initialShoppingItems, shoppingLists } from "@/data/shopping";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { getDelightMessage } from "@/lib/delightMessages";
import { shareFamilyText } from "@/lib/share";
import { storageKeys } from "@/lib/storageKeys";
import {
  markFirstUsefulAction,
  trackTelemetryEvent,
} from "@/services/telemetry";
import { parseShoppingText } from "@/services/ai/contextualSuggestionService";
import type { AISuggestion } from "@/types/aiSuggestions";
import { isShoppingItem, type ShoppingItem } from "@/types/shopping";
import { createUuid } from "@/utils/ids";

type ShoppingForm = Omit<ShoppingItem, "id" | "purchased">;
type PurchaseFilter = "remaining" | "all" | "purchased";

const inputClass =
  "min-h-11 rounded-2xl border border-[#cfc4b5] bg-white px-4 py-2.5 text-right text-sm font-semibold text-[#111827] outline-none transition placeholder:text-slate-600 focus:border-[#007aff]/60 focus:ring-4 focus:ring-[#007aff]/10";

const purchaseFilters: Array<{ id: PurchaseFilter; label: string }> = [
  { id: "remaining", label: "לקנות" },
  { id: "all", label: "הכל" },
  { id: "purchased", label: "נרכשו" },
];

function getInitialForm(): ShoppingForm {
  return {
    listName: shoppingLists[0],
    title: "",
    quantity: "1",
    department: "כללי",
    estimatedPrice: 0,
    buyer: "",
    notes: "",
  };
}

function getFormFromItem(item: ShoppingItem): ShoppingForm {
  return {
    listName: item.listName,
    title: item.title,
    quantity: item.quantity,
    department: item.department,
    estimatedPrice: item.estimatedPrice,
    buyer: item.buyer,
    notes: item.notes,
  };
}

function getDepartment(item: ShoppingItem) {
  return item.department.trim() || "כללי";
}

function getQuantityNumber(quantity: string | undefined) {
  const parsedQuantity = Number.parseInt(quantity ?? "1", 10);
  return Number.isFinite(parsedQuantity) && parsedQuantity > 0
    ? parsedQuantity
    : 1;
}

function sortShoppingItems(items: ShoppingItem[]) {
  return [...items].sort((a, b) => {
    const purchasedDiff = Number(a.purchased) - Number(b.purchased);
    return purchasedDiff || a.title.localeCompare(b.title, "he");
  });
}

function groupByDepartment(items: ShoppingItem[]) {
  return items.reduce<Record<string, ShoppingItem[]>>((groups, item) => {
    const department = getDepartment(item);

    return {
      ...groups,
      [department]: [...(groups[department] ?? []), item],
    };
  }, {});
}

export default function ShoppingManager() {
  const [items, setItems] = usePersistentArrayState<ShoppingItem>(
    storageKeys.shopping,
    initialShoppingItems,
    isShoppingItem
  );
  const [form, setForm] = useState<ShoppingForm>(getInitialForm);
  const [quickTitle, setQuickTitle] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [activeList, setActiveList] = useState("all");
  const [activeDepartment, setActiveDepartment] = useState("all");
  const [purchaseFilter, setPurchaseFilter] =
    useState<PurchaseFilter>("remaining");
  const [searchValue, setSearchValue] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [shoppingSuggestions, setShoppingSuggestions] = useState<AISuggestion[]>([]);
  const [suggestionNotice, setSuggestionNotice] = useState("");

  useEffect(() => {
    if (!isFormOpen && !activeItemId) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFormOpen(false);
        setActiveItemId(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFormOpen, activeItemId]);

  const isEditing = Boolean(editingItemId);
  const purchasedItems = items.filter((item) => item.purchased);

  // התקדמות הקנייה בהקשר הרשימה הפעילה — הלב של תחושת ההתקדמות.
  const scopeItems =
    activeList === "all"
      ? items
      : items.filter((item) => item.listName === activeList);
  const scopeDone = scopeItems.filter((item) => item.purchased).length;
  const scopeTotal = scopeItems.length;
  const scopeRemaining = scopeTotal - scopeDone;
  const progressPercent =
    scopeTotal === 0 ? 0 : Math.round((scopeDone / scopeTotal) * 100);
  const isListComplete = scopeTotal > 0 && scopeRemaining === 0;
  const isAlmostDone =
    scopeRemaining > 0 && scopeRemaining <= 3 && scopeDone > 0;

  const progressLine = isListComplete
    ? "הכול נאסף — אפשר לסיים את הקנייה בשקט"
    : isAlmostDone
      ? scopeRemaining === 1
        ? "כמעט שם — נשאר פריט אחרון"
        : `כמעט שם — נשארו ${scopeRemaining} פריטים`
      : scopeTotal === 0
        ? "הרשימה ריקה ומוכנה לפריט הראשון"
        : `נאספו ${scopeDone} מתוך ${scopeTotal}`;
  const { confirm, toast } = useFeedback();
  const [, setFinanceTransactions] =
    usePersistentArrayState<FinanceTransaction>(
      storageKeys.finance,
      initialFinanceTransactions,
      isFinanceTransaction
    );

  // קבלה שאושרה בדיאלוג הסריקה נשמרת כהוצאה בכספים — בלחיצה אחת.
  function handleConfirmReceiptExpense(expense: {
    id?: string;
    title: string;
    category: string;
    amount: number;
    date: string;
    notes?: string;
    source?: "receipt_scan";
    receiptReference?: string;
    documentReference?: string;
    originalTotal?: number;
    reimbursementAmount?: number;
    aiConfidence?: number;
  }) {
    setFinanceTransactions((currentTransactions) => [
      {
        id: expense.id ?? createUuid(),
        title: expense.title,
        category: expense.category,
        amount: expense.amount,
        type: "expense",
        date: expense.date,
        status: "done",
        notes: expense.notes,
        source: expense.source,
        receiptReference: expense.receiptReference,
        documentReference: expense.documentReference,
        originalTotal: expense.originalTotal,
        reimbursementAmount: expense.reimbursementAmount,
        aiConfidence: expense.aiConfidence,
      },
      ...currentTransactions,
    ]);
    markFirstUsefulAction("receipt_confirmed", "shopping");
    trackTelemetryEvent({
      name: "expense_created",
      module: "finance",
      properties: {
        source: "receipt_scan",
        hasDocumentReference: Boolean(expense.documentReference),
      },
    });
    toast({
      title: "ההוצאה נשמרה בכספים",
      description: `${expense.title} · ₪${expense.amount.toLocaleString("he-IL")}`,
      tone: "success",
    });
  }

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        items
          .filter((item) => activeList === "all" || item.listName === activeList)
          .map(getDepartment)
      )
    ).sort((a, b) => a.localeCompare(b, "he"));
  }, [activeList, items]);

  const visibleItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return sortShoppingItems(
      items
        .filter((item) => activeList === "all" || item.listName === activeList)
        .filter(
          (item) =>
            activeDepartment === "all" || getDepartment(item) === activeDepartment
        )
        .filter((item) => {
          if (purchaseFilter === "remaining") return !item.purchased;
          if (purchaseFilter === "purchased") return item.purchased;
          return true;
        })
        .filter((item) => {
          if (!normalizedSearch) return true;

          return (
            item.title.toLowerCase().includes(normalizedSearch) ||
            item.department.toLowerCase().includes(normalizedSearch) ||
            item.buyer.toLowerCase().includes(normalizedSearch) ||
            item.listName.toLowerCase().includes(normalizedSearch) ||
            item.notes.toLowerCase().includes(normalizedSearch)
          );
        })
    );
  }, [activeDepartment, activeList, items, purchaseFilter, searchValue]);

  const departmentEntries = Object.entries(groupByDepartment(visibleItems)).sort(
    ([a], [b]) => a.localeCompare(b, "he")
  );
  const activeItem = items.find((item) => item.id === activeItemId) ?? null;

  function getDefaultListName() {
    return activeList === "all" ? shoppingLists[0] : activeList;
  }

  function getDefaultDepartment() {
    return activeDepartment === "all" ? "כללי" : activeDepartment;
  }

  function resetForm() {
    setForm(getInitialForm());
    setEditingItemId(null);
    setIsFormOpen(false);
    setIsMoreOptionsOpen(false);
  }

  function addItemFromTitle(title: string) {
    const cleanTitle = title.trim();

    if (!cleanTitle) return;

    setItems((currentItems) => [
      {
        id: createUuid(),
        listName: getDefaultListName(),
        title: cleanTitle,
        quantity: "1",
        department: getDefaultDepartment(),
        estimatedPrice: 0,
        buyer: "",
        notes: "",
        purchased: false,
      },
      ...currentItems,
    ]);
    markFirstUsefulAction("shopping_item_created", "shopping");
    trackTelemetryEvent({
      name: "shopping_item_created",
      module: "shopping",
      properties: {
        source: "quick_add",
        listActive: activeList !== "all",
        departmentActive: activeDepartment !== "all",
      },
    });
    setPurchaseFilter("remaining");
    setQuickTitle("");
    const message = getDelightMessage("shoppingItemAdded", {
      title: cleanTitle,
    });
    toast({
      title: message.title,
      description: message.description,
      tone: "success",
      dedupeKey: `shopping:${cleanTitle}:added`,
    });
  }

  function handleQuickAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addItemFromTitle(quickTitle);
  }

  // שיתוף הרשימה למי שבסופר — דרך שיתוף המכשיר או וואטסאפ, בלי שרת.
  async function handleShareList() {
    const itemsToShare = scopeItems.filter((item) => !item.purchased);

    if (itemsToShare.length === 0) {
      return;
    }

    const listTitle =
      activeList === "all" ? "רשימת הקניות שלנו" : `רשימת קניות · ${activeList}`;
    const lines = itemsToShare.map((item) => {
      const quantity = getQuantityNumber(item.quantity);
      return `▫️ ${item.title}${quantity > 1 ? ` (${quantity})` : ""}`;
    });
    const shareText = `🛒 ${listTitle}\n${lines.join("\n")}`;

    const outcome = await shareFamilyText(shareText, listTitle);

    trackTelemetryEvent({
      name: "shopping_list_shared",
      module: "shopping",
      properties: { outcome, itemCount: itemsToShare.length },
    });

    if (outcome === "failed") {
      toast({
        title: "השיתוף לא הצליח",
        description: "אפשר לנסות שוב, או לצלם מסך של הרשימה.",
        tone: "danger",
      });
    }
  }

  function requestShoppingSuggestions() {
    const nextSuggestions = parseShoppingText({
      sourceModule: "shopping",
      sourceEntityType: "shopping_text",
      sourceEntityId: quickTitle || "quick-add",
      text: quickTitle,
    });

    setShoppingSuggestions(nextSuggestions);
    setSuggestionNotice(
      nextSuggestions.length === 0
        ? "לא נמצאו כמה פריטים בטוחים. אפשר להוסיף מוצר אחד כרגיל."
        : ""
    );
  }

  function applyShoppingSuggestion(suggestion: AISuggestion) {
    const rawItems = suggestion.proposedValues.items;

    if (typeof rawItems !== "string") {
      return;
    }

    try {
      const parsedItems = JSON.parse(rawItems) as Array<{
        title?: string;
        quantity?: string;
      }>;
      const newItems: ShoppingItem[] = parsedItems
        .filter((item) => item.title?.trim())
        .map((item) => ({
          id: createUuid(),
          listName: getDefaultListName(),
          title: item.title?.trim() ?? "",
          quantity: item.quantity || "1",
          department: getDefaultDepartment(),
          estimatedPrice: 0,
          buyer: "",
          notes: "",
          purchased: false,
        }));

      if (newItems.length === 0) {
        return;
      }

      setItems((currentItems) => [...newItems, ...currentItems]);
      setPurchaseFilter("remaining");
      setQuickTitle("");
      setShoppingSuggestions((current) =>
        current.filter((item) => item.id !== suggestion.id)
      );
      setSuggestionNotice(`${newItems.length} פריטים נוספו לרשימה.`);
      trackTelemetryEvent({
        name: "ai_suggestion_accepted",
        module: "shopping",
        properties: { suggestionType: suggestion.suggestionType },
      });
    } catch {
      setSuggestionNotice("לא הצלחנו להחיל את ההצעה. אפשר להמשיך ידנית.");
    }
  }

  function openNewProductForm() {
    setEditingItemId(null);
    setForm({
      ...getInitialForm(),
      title: quickTitle.trim(),
      listName: getDefaultListName(),
      department: getDefaultDepartment(),
    });
    setIsFormOpen(true);
    setIsMoreOptionsOpen(Boolean(quickTitle.trim()));
  }

  function updateFormQuantity(direction: "increase" | "decrease") {
    setForm((currentForm) => {
      const currentQuantity = getQuantityNumber(currentForm.quantity);
      const nextQuantity =
        direction === "increase"
          ? currentQuantity + 1
          : Math.max(1, currentQuantity - 1);

      return { ...currentForm, quantity: String(nextQuantity) };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = form.title.trim();
    const cleanDepartment = form.department.trim() || "כללי";
    const cleanBuyer = form.buyer.trim();
    const cleanQuantity = String(getQuantityNumber(form.quantity));

    if (!cleanTitle) return;

    if (editingItemId) {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                ...form,
                title: cleanTitle,
                quantity: cleanQuantity,
                department: cleanDepartment,
                buyer: cleanBuyer,
              }
            : item
        )
      );
      resetForm();
      toast({
        title: "המוצר עודכן",
        description: cleanTitle,
        tone: "success",
      });
      return;
    }

    setItems((currentItems) => [
      {
        id: createUuid(),
        ...form,
        title: cleanTitle,
        quantity: cleanQuantity,
        department: cleanDepartment,
        buyer: cleanBuyer,
        purchased: false,
      },
      ...currentItems,
    ]);
    markFirstUsefulAction("shopping_item_created", "shopping");
    trackTelemetryEvent({
      name: "shopping_item_created",
      module: "shopping",
      properties: {
        source: "full_form",
        hasBuyer: Boolean(cleanBuyer),
        hasEstimatedPrice: form.estimatedPrice > 0,
      },
    });
    setPurchaseFilter("remaining");
    setQuickTitle("");
    resetForm();
    toast({
      title: "נוסף לרשימה",
      description: `${cleanTitle} מחכה לקנייה הבאה.`,
      tone: "success",
    });
  }

  function togglePurchased(id: string) {
    const item = items.find((currentItem) => currentItem.id === id);
    const isPurchasing = item ? !item.purchased : false;

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? item.purchased
            ? { ...item, purchased: false, purchasedAt: undefined }
            : { ...item, purchased: true, purchasedAt: new Date().toISOString() }
          : item
      )
    );

    if (item && isPurchasing) {
      const remainingAfterPurchase = items.filter(
        (currentItem) => !currentItem.purchased && currentItem.id !== id
      ).length;

      markFirstUsefulAction("shopping_item_purchased", "shopping");
      trackTelemetryEvent({
        name: "shopping_item_purchased",
        module: "shopping",
        properties: {
          hasBuyer: Boolean(item.buyer),
          hasEstimatedPrice: item.estimatedPrice > 0,
        },
      });

      if (remainingAfterPurchase > 0) {
        const message = getDelightMessage("shoppingItemPurchased", {
          title: item.title,
          remaining: remainingAfterPurchase,
        });

        toast({
          title: message.title,
          description: message.description,
          tone: "success",
          actionLabel: "ביטול",
          actionKind: "undo",
          dedupeKey: `shopping:${item.id}:purchased`,
          onAction: () => {
            setItems((currentItems) =>
              currentItems.map((currentItem) =>
                currentItem.id === item.id
                  ? { ...currentItem, purchased: false, purchasedAt: undefined }
                  : currentItem
              )
            );
          },
        });
      }

      if (remainingAfterPurchase === 0) {
        toast({
          title: "הרשימה הושלמה",
          description: "כל הפריטים סומנו כנרכשו. אפשר לסיים את הקנייה בשקט.",
          tone: "success",
        });
      }
    }
  }

  function updateQuantity(id: string, direction: "increase" | "decrease") {
    setItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== id) return item;

        const currentQuantity = getQuantityNumber(item.quantity);
        const nextQuantity =
          direction === "increase"
            ? currentQuantity + 1
            : Math.max(1, currentQuantity - 1);

        if (nextQuantity === currentQuantity) return item;
        return { ...item, quantity: String(nextQuantity) };
      })
    );
  }

  function editItem(item: ShoppingItem) {
    setEditingItemId(item.id);
    setForm(getFormFromItem(item));
    setIsFormOpen(true);
    setIsMoreOptionsOpen(true);
    setActiveItemId(null);
  }

  async function deleteItem(id: string) {
    const item = items.find((currentItem) => currentItem.id === id);
    const itemTitle = item?.title ?? "המוצר הזה";
    const approved = await confirm({
      title: "מחיקת מוצר",
      description: `למחוק את "${itemTitle}" מהרשימה?`,
      confirmLabel: "מחק מוצר",
      cancelLabel: "ביטול",
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    setActiveItemId(null);
    toast({
      title: "המוצר נמחק",
      description: itemTitle,
      tone: "info",
    });
  }

  async function clearPurchasedFromCurrentView() {
    const purchasedInView = items.filter(
      (item) =>
        item.purchased && (activeList === "all" || item.listName === activeList)
    );

    if (purchasedInView.length === 0) {
      toast({
        title: "אין פריטים לניקוי",
        description: "כל מה שמופיע כרגע עדיין מחכה לקנייה.",
        tone: "info",
      });
      return;
    }

    const approved = await confirm({
      title: "ניקוי פריטים שנרכשו",
      description: `להסיר ${purchasedInView.length} פריטים שנרכשו מהרשימה?`,
      confirmLabel: "נקה מהרשימה",
      cancelLabel: "ביטול",
      tone: "danger",
    });

    if (!approved) {
      return;
    }

    setItems((currentItems) =>
      currentItems.filter((item) => {
        if (!item.purchased) return true;
        if (activeList !== "all" && item.listName !== activeList) return true;
        return false;
      })
    );
    setActiveItemId(null);
    toast({
      title: "הרשימה נוקתה",
      description: `${purchasedInView.length} פריטים שנרכשו הוסרו.`,
      tone: "success",
    });
  }

  return (
    <section className="space-y-2.5 pb-[calc(var(--nestly-bottom-nav-height)+var(--nestly-safe-bottom-gap)+1rem)] text-right lg:pb-0">
      <section className="rounded-[22px] bg-[#fffdf8] p-3 shadow-[0_10px_24px_rgba(33,43,63,0.05)]">
        {/* ההוספה היא נקודת הפתיחה — לפני כל דבר אחר. */}
        <form
          onSubmit={handleQuickAdd}
          className="flex min-h-[52px] items-center overflow-hidden rounded-2xl bg-white p-1 shadow-sm ring-1 ring-[#d8caba]/60 focus-within:ring-2 focus-within:ring-[#d8b470]"
        >
          <label className="sr-only" htmlFor="quick-shopping-item">
            הוסף מוצר מהיר
          </label>
          <input
            id="quick-shopping-item"
            value={quickTitle}
            onChange={(event) => setQuickTitle(event.target.value)}
            className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-right text-base font-black text-[#111827] outline-none placeholder:text-slate-500"
            placeholder="מה להוסיף לרשימה?"
          />
          <button
            type="submit"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#111827] text-xl font-black text-white transition hover:bg-[#2a3142] active:scale-[0.98]"
            aria-label="הוסף מוצר לרשימה"
          >
            +
          </button>
        </form>

        {/* התקדמות במבט אחד: כמה נשאר, כמה כבר נאסף. */}
        <div className="mt-2.5">
          <div className="flex items-center justify-between gap-2">
            <span
              className={[
                "text-xs font-black",
                isListComplete
                  ? "text-emerald-700"
                  : isAlmostDone
                    ? "text-[#9a6b17]"
                    : "text-slate-600",
              ].join(" ")}
            >
              {progressLine}
            </span>
            {scopeTotal > 0 && (
              <span className="text-xs font-bold tabular-nums text-slate-500">
                {scopeRemaining > 0 ? `${scopeRemaining} לקנות` : "🎉"}
              </span>
            )}
          </div>
          {scopeTotal > 0 && (
            <div
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#efe9dd]"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="התקדמות הקנייה"
            >
              <div
                className={[
                  "h-full rounded-full transition-all duration-500",
                  isListComplete ? "bg-emerald-500" : "bg-[#d8b470]",
                ].join(" ")}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* פעולות תומכות — שקטות, לא מתחרות בהוספה. */}
        <div className="mt-2.5 flex items-center gap-3">
          <button
            type="button"
            onClick={openNewProductForm}
            className="min-h-9 text-xs font-black text-slate-500 transition hover:text-[#111827]"
          >
            + פרטים נוספים
          </button>
          <ReceiptScanPreview
            triggerClassName="inline-flex min-h-9 cursor-pointer items-center text-xs font-black text-slate-500 transition hover:text-[#7a5212]"
            onConfirmExpense={handleConfirmReceiptExpense}
          />
          <button
            type="button"
            onClick={requestShoppingSuggestions}
            className="min-h-9 text-xs font-black text-slate-500 transition hover:text-sky-800"
          >
            הצעות חכמות
          </button>
          {scopeRemaining > 0 && (
            <button
              type="button"
              onClick={() => void handleShareList()}
              className="group ms-auto inline-flex min-h-9 items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 text-xs font-black text-white shadow-[0_8px_18px_rgba(16,185,129,0.35)] transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-500 hover:shadow-[0_12px_24px_rgba(16,185,129,0.45)] active:scale-95"
            >
              <AppIcon
                name="whatsapp"
                className="h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:-rotate-12 group-hover:scale-110"
              />
              שתף בוואטסאפ
            </button>
          )}
        </div>
        {suggestionNotice ? (
          <p className="mt-2 rounded-2xl bg-[#fff8eb] px-3 py-2 text-xs font-bold text-[#7a5212]">
            {suggestionNotice}
          </p>
        ) : null}
        {shoppingSuggestions.length > 0 ? (
          <div className="mt-2 grid gap-2">
            {shoppingSuggestions.map((suggestion) => (
              <AISuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onApply={applyShoppingSuggestion}
                onReject={() =>
                  setShoppingSuggestions((current) =>
                    current.filter((item) => item.id !== suggestion.id)
                  )
                }
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="nestly-sticky-below-header sticky z-20 rounded-[22px] bg-white/90 px-1 py-1.5 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex shrink-0 gap-1.5">
            {purchaseFilters.map((filter) => {
              const isActive = purchaseFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setPurchaseFilter(filter.id)}
                  className={[
                    "min-h-10 rounded-full px-3.5 text-xs font-black transition",
                    isActive
                      ? "bg-[#111827] text-white shadow-sm"
                      : "text-slate-600 hover:bg-[#fff8eb]",
                  ].join(" ")}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((currentValue) => !currentValue)}
            className={[
              "min-h-10 rounded-full px-3.5 text-xs font-black transition",
              showFilters
                ? "bg-[#fff8eb] text-[#7a5212]"
                : "text-slate-500 hover:bg-[#fff8eb]",
            ].join(" ")}
            aria-expanded={showFilters}
          >
            סינון
          </button>
        </div>

        {showFilters && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className={`${inputClass} min-w-0 flex-1`}
                placeholder="חיפוש מוצר"
                aria-label="חיפוש ברשימת הקניות"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  setActiveDepartment("all");
                  setActiveList("all");
                  setPurchaseFilter("remaining");
                }}
                className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-3 text-xs font-black text-slate-700 transition hover:bg-white"
              >
                איפוס
              </button>
            </div>

            <div className="premium-scrollbar flex gap-1.5 overflow-x-auto pb-1">
              {["all", ...shoppingLists].map((listName) => {
                const isActive = activeList === listName;

                return (
                  <button
                    key={listName}
                    type="button"
                    onClick={() => {
                      setActiveList(listName);
                      setActiveDepartment("all");
                    }}
                    className={[
                      "min-h-9 shrink-0 rounded-full px-3.5 text-xs font-black transition",
                      isActive
                        ? "bg-[#fff8eb] text-[#111827] ring-1 ring-[#d8b470]/50"
                        : "border border-[#e6e8ec] bg-white text-slate-600 hover:bg-[#fff8eb]",
                    ].join(" ")}
                  >
                    {listName === "all" ? "כל הרשימות" : listName}
                  </button>
                );
              })}
            </div>

            {departments.length > 0 && (
              <div className="premium-scrollbar flex gap-1.5 overflow-x-auto pb-1">
                {["all", ...departments].map((department) => {
                  const isActive = activeDepartment === department;

                  return (
                    <button
                      key={department}
                      type="button"
                      onClick={() => setActiveDepartment(department)}
                      className={[
                        "min-h-9 shrink-0 rounded-full px-3.5 text-xs font-black transition",
                        isActive
                          ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
                          : "border border-[#e6e8ec] bg-white text-slate-600 hover:bg-emerald-50",
                      ].join(" ")}
                    >
                      {department === "all" ? "כל המחלקות" : department}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-[22px] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
        {departmentEntries.length === 0 ? (
          isListComplete && purchaseFilter === "remaining" ? (
            // הרשימה הושלמה — רגע של הצלחה, לא מסך ריק.
            <div className="px-5 py-8 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-emerald-50 text-2xl">
                🎉
              </div>
              <p className="mt-3 text-base font-black text-emerald-800">
                כל הרשימה נאספה!
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                אפשר לסיים את הקנייה בשקט, או להתחיל רשימה חדשה.
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => void clearPurchasedFromCurrentView()}
                  className="min-h-10 rounded-full bg-emerald-700 px-4 text-xs font-black text-white transition hover:bg-emerald-800"
                >
                  נקה ותתחיל רשימה חדשה
                </button>
                <button
                  type="button"
                  onClick={() => setPurchaseFilter("purchased")}
                  className="min-h-10 rounded-full bg-slate-100 px-4 text-xs font-black text-slate-700 transition hover:bg-white"
                >
                  מה נקנה
                </button>
              </div>
            </div>
          ) : purchaseFilter === "purchased" ? (
            <div className="px-5 py-8 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-[#fff8eb] text-2xl">
                🛒
              </div>
              <p className="mt-3 text-base font-black text-[#111827]">
                עוד לא סומנו פריטים כנרכשו
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                בזמן הקנייה, נגיעה בעיגול ליד מוצר מסמנת שהוא בעגלה.
              </p>
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-[#fff8eb] text-2xl">
                +
              </div>
              <p className="mt-3 text-base font-black text-[#111827]">
                הרשימה מחכה למוצר הראשון
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                כתבו מוצר בשדה למעלה ולחצו פלוס — זה כל מה שצריך.
              </p>
            </div>
          )
        ) : (
          <div className="space-y-1">
            {departmentEntries.map(([department, departmentItems]) => (
              <div key={department}>
                <div className="flex h-8 items-center justify-between px-3 pt-1">
                  <span className="text-[11px] font-bold text-slate-400">
                    {departmentItems.filter((item) => !item.purchased).length > 0
                      ? `${departmentItems.filter((item) => !item.purchased).length} לקנות`
                      : "✓"}
                  </span>
                  <span className="text-xs font-black text-[#9a6b17]">
                    {department}
                  </span>
                </div>

                <div className="divide-y divide-[#eef0f3]">
                  {departmentItems.map((item) => (
                    <article
                      key={item.id}
                      className={[
                        "grid min-h-[58px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2.5 py-1 transition hover:bg-[#fafafb]",
                        item.purchased ? "bg-[#fafafb]/70 opacity-75" : "",
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        onClick={() => togglePurchased(item.id)}
                        className={[
                          "grid h-10 w-10 shrink-0 place-items-center rounded-full border text-base font-black transition",
                          item.purchased
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-[#d9dde5] bg-white text-slate-400 hover:border-emerald-300 hover:text-emerald-700",
                        ].join(" ")}
                        aria-label={
                          item.purchased ? "החזר לרשימת הקניות" : "סמן כנרכש"
                        }
                      >
                        {item.purchased ? "✓" : ""}
                      </button>

                      <button
                        type="button"
                        onClick={() => togglePurchased(item.id)}
                        className="min-w-0 text-right"
                      >
                        <span
                          className={[
                            "block truncate text-[15px] font-black leading-5",
                            item.purchased
                              ? "text-slate-500 line-through"
                              : "text-[#111827]",
                          ].join(" ")}
                        >
                          {item.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-600">
                          {item.listName}
                          {item.buyer ? ` · ${item.buyer}` : ""}
                          {item.estimatedPrice > 0
                            ? ` · ${item.estimatedPrice.toLocaleString("he-IL")} ₪`
                            : ""}
                        </span>
                      </button>

                      <div className="flex items-center gap-1">
                        <div
                          className="grid h-9 grid-cols-[1.8rem_1.8rem_1.8rem] items-center overflow-hidden rounded-full border border-[#eadfcd] bg-[#fffdf8] text-center shadow-sm"
                          aria-label={`כמות ${item.title}`}
                        >
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, "decrease")}
                            disabled={getQuantityNumber(item.quantity) <= 1}
                            className="grid h-9 w-[1.8rem] place-items-center text-base font-black text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
                            aria-label={`הפחת כמות של ${item.title}`}
                          >
                            -
                          </button>
                          <span className="grid h-9 min-w-[1.8rem] place-items-center border-x border-[#eadfcd] text-sm font-black tabular-nums text-[#111827]">
                            {getQuantityNumber(item.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, "increase")}
                            className="grid h-9 w-[1.8rem] place-items-center text-base font-black text-slate-700 transition hover:bg-white"
                            aria-label={`הגדל כמות של ${item.title}`}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveItemId(item.id)}
                          className="grid h-9 w-8 shrink-0 place-items-center rounded-full text-sm font-black text-slate-400 transition hover:bg-[#fff8eb] hover:text-[#111827]"
                          aria-label={`פרטי מוצר: ${item.title}`}
                        >
                          ...
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 px-3 pb-3 backdrop-blur-[2px] sm:items-center sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) resetForm();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shopping-form-dialog-title"
            className="w-full max-w-xl rounded-[24px] border border-[#eadfcd] bg-white p-4 text-right shadow-[0_28px_90px_rgba(15,23,42,0.24)]"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="grid h-11 w-11 place-items-center rounded-full border border-[#e6e8ec] bg-white text-lg font-black text-slate-600"
                aria-label="סגור"
              >
                ×
              </button>
              <div>
                <p className="text-xs font-black text-[#9a6b17]">
                  {isEditing ? "עריכת מוצר" : "מוצר עם פרטים"}
                </p>
                <h2
                  id="shopping-form-dialog-title"
                  className="text-lg font-black text-[#111827]"
                >
                  {isEditing ? "עדכון מוצר ברשימה" : "הוספה מפורטת"}
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="rounded-[20px] border border-[#eef0f3] bg-[#fafafb] p-3">
                <label className="block">
                  <span className="block text-sm font-black text-[#111827]">
                    שם המוצר
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                    מה צריך לקנות?
                  </span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        title: event.target.value,
                      }))
                    }
                    required
                    autoFocus
                    className={`${inputClass} mt-2 w-full bg-white`}
                    placeholder="לדוגמה: חלב, לחם, סוללות"
                  />
                </label>

                <div className="mt-3">
                  <span className="block text-sm font-black text-[#111827]">
                    כמות
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                    אפשר לשנות גם מתוך הרשימה.
                  </span>
                  <div className="mt-2 grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center overflow-hidden rounded-2xl border border-[#eadfcd] bg-white">
                    <button
                      type="button"
                      onClick={() => updateFormQuantity("decrease")}
                      disabled={getQuantityNumber(form.quantity) <= 1}
                      className="grid min-h-12 place-items-center text-xl font-black text-slate-700 transition hover:bg-[#fff8eb] disabled:cursor-not-allowed disabled:text-slate-300"
                      aria-label="הפחת כמות"
                    >
                      -
                    </button>
                    <input
                      value={getQuantityNumber(form.quantity)}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          quantity: String(getQuantityNumber(event.target.value)),
                        }))
                      }
                      inputMode="numeric"
                      className="min-h-12 border-x border-[#eadfcd] bg-[#fffdf8] text-center text-xl font-black tabular-nums text-[#111827] outline-none"
                      aria-label="כמות מוצר"
                    />
                    <button
                      type="button"
                      onClick={() => updateFormQuantity("increase")}
                      className="grid min-h-12 place-items-center text-xl font-black text-slate-700 transition hover:bg-[#fff8eb]"
                      aria-label="הגדל כמות"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsMoreOptionsOpen((currentValue) => !currentValue)
                }
                className="flex min-h-11 w-full items-center justify-between rounded-2xl border border-[#e6e8ec] bg-white px-4 text-sm font-black text-slate-800 transition hover:bg-[#fff8eb]"
                aria-expanded={isMoreOptionsOpen}
              >
                <span className="text-lg leading-none">
                  {isMoreOptionsOpen ? "-" : "+"}
                </span>
                <span>אפשרויות נוספות</span>
              </button>

              {isMoreOptionsOpen && (
                <div className="grid gap-3 rounded-[20px] border border-[#eef0f3] bg-white p-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="block text-sm font-black text-[#111827]">
                      קטגוריה
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                      למשל: מקרר, ניקיון, בית.
                    </span>
                    <input
                      value={form.department}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          department: event.target.value,
                        }))
                      }
                      className={`${inputClass} mt-2 w-full`}
                      placeholder="כללי"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-sm font-black text-[#111827]">
                      חנות
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                      אופציונלי
                    </span>
                    <input
                      value={form.buyer}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          buyer: event.target.value,
                        }))
                      }
                      className={`${inputClass} mt-2 w-full`}
                      placeholder="לדוגמה: אושר עד"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-sm font-black text-[#111827]">
                      מחיר משוער
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                      אופציונלי
                    </span>
                    <input
                      value={form.estimatedPrice}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          estimatedPrice: Number(event.target.value),
                        }))
                      }
                      min="0"
                      type="number"
                      className={`${inputClass} mt-2 w-full`}
                      placeholder="0"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-sm font-black text-[#111827]">
                      רשימת קניות
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                      לאן לשייך את המוצר?
                    </span>
                    <select
                      value={form.listName}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          listName: event.target.value,
                        }))
                      }
                      className={`${inputClass} mt-2 w-full`}
                    >
                      {shoppingLists.map((listName) => (
                        <option key={listName} value={listName}>
                          {listName}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="block text-sm font-black text-[#111827]">
                      הערות
                    </span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                      אופציונלי
                    </span>
                    <textarea
                      value={form.notes}
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          notes: event.target.value,
                        }))
                      }
                      className={`${inputClass} mt-2 min-h-20 w-full resize-none`}
                      placeholder="מותג מועדף, גודל, או משהו שחשוב לזכור"
                    />
                  </label>
                </div>
              )}

              <button
                type="submit"
                className="min-h-12 w-full rounded-2xl border border-[#d8caba] bg-[#fffdf8] px-5 py-3 text-sm font-black text-[#111827] shadow-[0_10px_22px_rgba(33,43,63,0.08)] transition hover:bg-white active:scale-[0.99]"
              >
                {isEditing ? "שמור שינוי" : "הוסף לרשימה"}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/30 px-3 pb-3 backdrop-blur-[2px] sm:items-center sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setActiveItemId(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shopping-item-dialog-title"
            className="w-full max-w-md rounded-[24px] border border-[#eadfcd] bg-white p-4 text-right text-[#111827] shadow-[0_28px_90px_rgba(15,23,42,0.24)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#eef0f3] pb-3">
              <button
                type="button"
                onClick={() => setActiveItemId(null)}
                className="grid h-11 w-11 place-items-center rounded-full border border-[#e6e8ec] bg-white text-lg font-black text-slate-600"
                aria-label="סגור"
              >
                ×
              </button>

              <div className="min-w-0">
                <p className="text-xs font-black text-slate-500">
                  {getDepartment(activeItem)} · {activeItem.listName}
                </p>
                <h3
                  id="shopping-item-dialog-title"
                  className="mt-1 truncate text-lg font-black text-[#111827]"
                >
                  {activeItem.title}
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  כמות: {getQuantityNumber(activeItem.quantity)}
                  {activeItem.estimatedPrice > 0
                    ? ` · ${activeItem.estimatedPrice.toLocaleString("he-IL")} ₪`
                    : ""}
                </p>
              </div>
            </div>

            {activeItem.notes && (
              <p className="mt-3 rounded-2xl bg-[#fff8eb] px-3 py-2 text-sm font-semibold leading-6 text-slate-700">
                {activeItem.notes}
              </p>
            )}

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => togglePurchased(activeItem.id)}
                className={
                  activeItem.purchased
                    ? "min-h-11 rounded-2xl border border-[#e6e8ec] bg-white px-4 text-sm font-black text-slate-700 hover:bg-[#fff8eb]"
                    : "min-h-11 rounded-2xl bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800"
                }
              >
                {activeItem.purchased ? "החזר לרשימה" : "סמן כנרכש"}
              </button>
              <button
                type="button"
                onClick={() => editItem(activeItem)}
                className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-white px-4 text-sm font-black text-slate-700 hover:bg-[#fff8eb]"
              >
                עריכה
              </button>
              {purchasedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => void clearPurchasedFromCurrentView()}
                  className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-white px-4 text-sm font-black text-slate-700 hover:bg-[#fff8eb]"
                >
                  נקה נרכשו
                </button>
              )}
              <button
                type="button"
                onClick={() => void deleteItem(activeItem.id)}
                className="min-h-11 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 hover:bg-rose-100"
              >
                מחיקה
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
