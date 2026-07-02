"use client";

import { useMemo, useState, type FormEvent } from "react";
import { initialShoppingItems, shoppingLists } from "@/data/shopping";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { storageKeys } from "@/lib/storageKeys";
import type { ShoppingItem } from "@/types/shopping";

type ShoppingForm = Omit<ShoppingItem, "id" | "purchased">;
type PurchaseFilter = "remaining" | "all" | "purchased";

const commonInputClass =
  "min-h-11 rounded-2xl border border-[#d9dde5] bg-white px-4 py-3 text-right text-sm font-semibold text-[#111827] outline-none transition placeholder:text-slate-400 focus:border-[#007aff]/55 focus:ring-4 focus:ring-[#007aff]/10";

function getInitialForm(): ShoppingForm {
  return {
    listName: shoppingLists[0],
    title: "",
    quantity: "1",
    department: "כללי",
    estimatedPrice: 0,
    buyer: "הבית",
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

function groupByDepartment(items: ShoppingItem[]) {
  return items.reduce<Record<string, ShoppingItem[]>>((groups, item) => {
    const department = item.department.trim() || "כללי";
    return {
      ...groups,
      [department]: [...(groups[department] ?? []), item],
    };
  }, {});
}

function sortShoppingItems(items: ShoppingItem[]) {
  return [...items].sort((a, b) => {
    const purchasedDiff = Number(a.purchased) - Number(b.purchased);

    if (purchasedDiff !== 0) {
      return purchasedDiff;
    }

    return a.title.localeCompare(b.title, "he");
  });
}

export default function ShoppingManager() {
  const [items, setItems] = usePersistentArrayState<ShoppingItem>(
    storageKeys.shopping,
    initialShoppingItems
  );
  const [form, setForm] = useState<ShoppingForm>(getInitialForm);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [activeList, setActiveList] = useState("all");
  const [activeDepartment, setActiveDepartment] = useState("all");
  const [purchaseFilter, setPurchaseFilter] =
    useState<PurchaseFilter>("remaining");
  const [searchValue, setSearchValue] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showPurchased, setShowPurchased] = useState(false);

  const isEditing = Boolean(editingItemId);
  const remainingItems = items.filter((item) => !item.purchased);
  const purchasedItems = items.filter((item) => item.purchased);
  const totalEstimate = remainingItems.reduce(
    (sum, item) => sum + item.estimatedPrice,
    0
  );

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        items
          .filter((item) => activeList === "all" || item.listName === activeList)
          .map((item) => item.department.trim() || "כללי")
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
            activeDepartment === "all" ||
            (item.department.trim() || "כללי") === activeDepartment
        )
        .filter((item) => {
          if (purchaseFilter === "remaining") {
            return !item.purchased;
          }

          if (purchaseFilter === "purchased") {
            return item.purchased;
          }

          return true;
        })
        .filter((item) => {
          if (!normalizedSearch) {
            return true;
          }

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

  const groupedItems = useMemo(
    () => groupByDepartment(visibleItems),
    [visibleItems]
  );

  const departmentEntries = Object.entries(groupedItems).sort(([a], [b]) =>
    a.localeCompare(b, "he")
  );

  function resetForm() {
    setForm(getInitialForm());
    setEditingItemId(null);
    setIsFormOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = form.title.trim();
    const cleanDepartment = form.department.trim() || "כללי";
    const cleanBuyer = form.buyer.trim() || "הבית";

    if (!cleanTitle) {
      return;
    }

    if (editingItemId) {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                ...form,
                title: cleanTitle,
                department: cleanDepartment,
                buyer: cleanBuyer,
              }
            : item
        )
      );
      resetForm();
      return;
    }

    setItems((currentItems) => [
      {
        id: crypto.randomUUID(),
        ...form,
        title: cleanTitle,
        department: cleanDepartment,
        buyer: cleanBuyer,
        purchased: false,
      },
      ...currentItems,
    ]);
    resetForm();
  }

  function togglePurchased(id: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, purchased: !item.purchased } : item
      )
    );
  }

  function editItem(item: ShoppingItem) {
    setEditingItemId(item.id);
    setForm(getFormFromItem(item));
    setIsFormOpen(true);
  }

  function deleteItem(id: string) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }

  function clearPurchasedFromCurrentView() {
    setItems((currentItems) =>
      currentItems.filter((item) => {
        if (!item.purchased) {
          return true;
        }

        if (activeList !== "all" && item.listName !== activeList) {
          return true;
        }

        return false;
      })
    );
  }

  return (
    <section className="space-y-3">
      <section className="rounded-[22px] border border-[#e6e8ec] bg-white p-3 text-right shadow-[0_10px_26px_rgba(15,23,42,0.045)]">
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-[18px] border border-[#e6e8ec] bg-[#fafafb] p-3">
            <p className="text-xs font-bold text-slate-600">נשאר לקנות</p>
            <p className="mt-1 text-2xl font-black text-[#111827]">
              {remainingItems.length}
            </p>
          </div>
          <div className="rounded-[18px] border border-[#e6e8ec] bg-[#fafafb] p-3">
            <p className="text-xs font-bold text-slate-600">נרכשו</p>
            <p className="mt-1 text-2xl font-black text-[#111827]">
              {purchasedItems.length}
            </p>
          </div>
          <div className="rounded-[18px] border border-[#e6e8ec] bg-[#fafafb] p-3">
            <p className="text-xs font-bold text-slate-600">הערכה שנותרה</p>
            <p className="mt-1 text-2xl font-black text-[#111827]">
              {totalEstimate.toLocaleString("he-IL")} ₪
            </p>
          </div>
        </div>
      </section>

      <section className="sticky top-[4.6rem] z-20 rounded-[22px] border border-[#d9dde5] bg-white/95 p-3 text-right shadow-[0_14px_34px_rgba(15,23,42,0.07)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingItemId(null);
                setForm(getInitialForm());
                setIsFormOpen((currentValue) => !currentValue);
              }}
              className="min-h-11 rounded-2xl bg-[#111827] px-5 py-2.5 text-sm font-black text-white shadow-[0_14px_34px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:bg-[#1f2937]"
            >
              + הוסף מוצר
            </button>
            <button
              type="button"
              onClick={() => setShowPurchased((currentValue) => !currentValue)}
              className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-4 py-2.5 text-sm font-black text-slate-800 transition hover:bg-white"
            >
              {showPurchased ? "הסתר נרכשו" : "הצג נרכשו"}
            </button>
            {purchasedItems.length > 0 && (
              <button
                type="button"
                onClick={clearPurchasedFromCurrentView}
                className="min-h-11 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-800 transition hover:bg-rose-100"
              >
                נקה נרכשו
              </button>
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-slate-600">
              {visibleItems.length} מוצרים מוצגים
            </p>
            <h2 className="mt-1 text-lg font-black text-[#111827]">
              רשימת קניות לעבודה מהירה
            </h2>
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className={`${commonInputClass} xl:col-span-2`}
            placeholder="חיפוש מוצר, מחלקה, קונה או הערה"
          />
          <select
            value={activeList}
            onChange={(event) => {
              setActiveList(event.target.value);
              setActiveDepartment("all");
            }}
            className={commonInputClass}
          >
            <option value="all">כל הרשימות</option>
            {shoppingLists.map((listName) => (
              <option key={listName} value={listName}>
                {listName}
              </option>
            ))}
          </select>
          <select
            value={activeDepartment}
            onChange={(event) => setActiveDepartment(event.target.value)}
            className={commonInputClass}
          >
            <option value="all">כל המחלקות</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {[
            { id: "remaining", label: "רק מה שנשאר" },
            { id: "all", label: "הכל" },
            { id: "purchased", label: "נרכשו" },
          ].map((filter) => {
            const isActive = purchaseFilter === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setPurchaseFilter(filter.id as PurchaseFilter)}
                className={
                  isActive
                    ? "min-h-10 rounded-2xl bg-[#111827] px-4 py-2 text-sm font-black text-white"
                    : "min-h-10 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-4 py-2 text-sm font-black text-slate-700 hover:bg-white"
                }
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </section>

      {isFormOpen && (
        <section className="rounded-[22px] border border-[#d9dde5] bg-white p-4 text-right shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={resetForm}
              className="w-fit rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-white"
            >
              ביטול
            </button>
            <div>
              <p className="text-xs font-bold text-slate-600">
                {isEditing ? "עריכת מוצר" : "מוצר חדש"}
              </p>
              <h2 className="mt-1 text-lg font-black text-[#111827]">
                {isEditing ? "עדכון מוצר ברשימה" : "הוספת מוצר לקניות"}
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-2 lg:grid-cols-6">
            <select
              value={form.listName}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  listName: event.target.value,
                }))
              }
              className={commonInputClass}
            >
              {shoppingLists.map((listName) => (
                <option key={listName} value={listName}>
                  {listName}
                </option>
              ))}
            </select>

            <input
              value={form.title}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  title: event.target.value,
                }))
              }
              required
              className={`${commonInputClass} lg:col-span-2`}
              placeholder="שם המוצר"
            />

            <input
              value={form.quantity}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  quantity: event.target.value,
                }))
              }
              className={commonInputClass}
              placeholder="כמות"
            />

            <input
              value={form.department}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  department: event.target.value,
                }))
              }
              className={commonInputClass}
              placeholder="מחלקה"
            />

            <input
              value={form.buyer}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  buyer: event.target.value,
                }))
              }
              className={commonInputClass}
              placeholder="מי קונה"
            />

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
              className={commonInputClass}
              placeholder="מחיר משוער"
            />

            <input
              value={form.notes}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  notes: event.target.value,
                }))
              }
              className={`${commonInputClass} lg:col-span-4`}
              placeholder="הערות"
            />

            <button
              type="submit"
              className="min-h-11 rounded-2xl bg-[#111827] px-5 py-3 text-sm font-black text-white hover:bg-[#1f2937] lg:col-span-2"
            >
              {isEditing ? "שמור שינוי" : "הוסף מוצר"}
            </button>
          </form>
        </section>
      )}

      <section className="rounded-[22px] border border-[#e6e8ec] bg-white p-3 text-right shadow-[0_10px_26px_rgba(15,23,42,0.045)]">
        {departmentEntries.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[#cbd5e1] bg-[#fafafb] p-6 text-center">
            <p className="text-base font-black text-[#111827]">
              אין מוצרים להצגה
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              נסה לשנות חיפוש או להוסיף מוצר חדש.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {departmentEntries.map(([department, departmentItems]) => (
              <details key={department} open className="rounded-[18px] bg-[#fafafb]">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-[18px] border border-[#e6e8ec] bg-[#fafafb] px-3 py-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                    {departmentItems.filter((item) => !item.purchased).length} לקנות
                  </span>
                  <span className="text-base font-black text-[#111827]">
                    {department}
                  </span>
                </summary>

                <div className="divide-y divide-[#e6e8ec] overflow-hidden rounded-b-[18px] border-x border-b border-[#e6e8ec] bg-white">
                  {departmentItems.map((item) => (
                    <article
                      key={item.id}
                      className={[
                        "grid gap-3 px-3 py-2.5 transition hover:bg-[#fafafb] md:grid-cols-[minmax(0,1fr)_auto]",
                        item.purchased ? "opacity-70" : "",
                      ].join(" ")}
                    >
                      <div className="min-w-0 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <span className="rounded-full bg-[#f2f3f5] px-2.5 py-1 text-[11px] font-bold text-slate-700">
                            {item.listName}
                          </span>
                          <span className="rounded-full bg-[#f2f3f5] px-2.5 py-1 text-[11px] font-bold text-slate-700">
                            {item.buyer}
                          </span>
                          {item.estimatedPrice > 0 && (
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                              {item.estimatedPrice.toLocaleString("he-IL")} ₪
                            </span>
                          )}
                        </div>
                        <h3
                          className={[
                            "mt-2 truncate text-base font-black",
                            item.purchased
                              ? "text-slate-500 line-through"
                              : "text-[#111827]",
                          ].join(" ")}
                        >
                          {item.title}
                        </h3>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-600">
                          כמות: {item.quantity}
                          {item.notes ? ` / ${item.notes}` : ""}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => togglePurchased(item.id)}
                          className={
                            item.purchased
                              ? "min-h-11 rounded-2xl border border-[#e6e8ec] bg-white px-4 py-2 text-sm font-black text-slate-700"
                              : "min-h-11 rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-black text-white"
                          }
                        >
                          {item.purchased ? "בטל רכישה" : "סמן נרכש"}
                        </button>
                        <button
                          type="button"
                          onClick={() => editItem(item)}
                          className="min-h-11 rounded-2xl border border-[#e6e8ec] bg-[#fafafb] px-4 py-2 text-sm font-black text-slate-800 hover:bg-white"
                        >
                          ערוך
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          className="min-h-11 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-800 hover:bg-rose-100"
                        >
                          מחק
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      {showPurchased && purchasedItems.length > 0 && (
        <section className="rounded-[22px] border border-[#e6e8ec] bg-white p-3 text-right shadow-[0_10px_26px_rgba(15,23,42,0.045)]">
          <h2 className="mb-3 text-lg font-black text-[#111827]">
            מוצרים שנרכשו לאחרונה
          </h2>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {purchasedItems.slice(0, 12).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => togglePurchased(item.id)}
                className="rounded-2xl border border-[#e6e8ec] bg-[#fafafb] p-3 text-right transition hover:bg-white"
              >
                <span className="block truncate text-sm font-black text-slate-600 line-through">
                  {item.title}
                </span>
                <span className="mt-1 block text-xs font-semibold text-slate-500">
                  לחץ כדי להחזיר לרשימה
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
