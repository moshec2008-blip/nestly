"use client";

import { useMemo, useState, type FormEvent } from "react";
import { initialShoppingItems, shoppingLists } from "@/data/shopping";
import type { ShoppingItem } from "@/types/shopping";
import { usePersistentArrayState } from "@/hooks/usePersistentArrayState";
import { storageKeys } from "@/lib/storageKeys";

type ShoppingForm = Omit<ShoppingItem, "id" | "purchased">;

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

export default function ShoppingManager() {
  const [items, setItems] = usePersistentArrayState<ShoppingItem>(
    storageKeys.shopping,
    initialShoppingItems
  );
  const [form, setForm] = useState<ShoppingForm>(getInitialForm);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [activeList, setActiveList] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [showAllItems, setShowAllItems] = useState(false);

  const visibleItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return items
      .filter((item) => activeList === "all" || item.listName === activeList)
      .filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          item.title.toLowerCase().includes(normalizedSearch) ||
          item.department.toLowerCase().includes(normalizedSearch) ||
          item.buyer.toLowerCase().includes(normalizedSearch) ||
          item.notes.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => Number(a.purchased) - Number(b.purchased));
  }, [activeList, items, searchValue]);

  const purchasedCount = items.filter((item) => item.purchased).length;
  const totalEstimate = items.reduce(
    (sum, item) => sum + item.estimatedPrice,
    0
  );
  const isEditing = Boolean(editingItemId);
  const displayedItems = showAllItems ? visibleItems : visibleItems.slice(0, 5);

  function resetForm() {
    setForm(getInitialForm());
    setEditingItemId(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = form.title.trim();

    if (!cleanTitle) {
      return;
    }

    if (editingItemId) {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === editingItemId ? { ...item, ...form, title: cleanTitle } : item
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
  }

  function deleteItem(id: string) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-[18px] bg-slate-800/62 p-3 text-right shadow-[0_10px_30px_rgba(2,6,23,0.16)]">
          <p className="truncate text-[11px] text-slate-300">פריטים</p>
          <p className="mt-1 text-xl font-black">{items.length}</p>
        </div>
        <div className="rounded-[18px] bg-slate-800/62 p-3 text-right shadow-[0_10px_30px_rgba(2,6,23,0.16)]">
          <p className="truncate text-[11px] text-slate-300">נרכשו</p>
          <p className="mt-1 text-xl font-black">{purchasedCount}</p>
        </div>
        <div className="rounded-[18px] bg-slate-800/62 p-3 text-right shadow-[0_10px_30px_rgba(2,6,23,0.16)]">
          <p className="truncate text-[11px] text-slate-300">הערכה</p>
          <p className="mt-1 text-xl font-black">
            {totalEstimate.toLocaleString("he-IL")} ₪
          </p>
        </div>
      </div>

      <details
        open={isEditing}
        className="group rounded-[22px] bg-slate-800/58 p-3 text-right text-[#fff9ea] shadow-[0_12px_34px_rgba(2,6,23,0.18)]"
      >
        <summary className="cursor-pointer list-none">
          <p className="mb-1 text-[11px] text-slate-400">
            רשימה משותפת · סנכרון בזמן אמת יחובר בהמשך
          </p>
          <h2 className="text-lg font-black">
            {isEditing ? "עריכת פריט" : "הוספת פריט לקניות"}
          </h2>
        </summary>

        <form onSubmit={handleSubmit} className="mt-3 grid gap-3 lg:grid-cols-6">
          <select
            value={form.listName}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                listName: event.target.value,
              }))
            }
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none"
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
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500 lg:col-span-2"
            placeholder="שם הפריט"
          />

          <input
            value={form.quantity}
            onChange={(event) =>
              setForm((currentForm) => ({
                ...currentForm,
                quantity: event.target.value,
              }))
            }
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
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
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
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
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
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
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
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
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500 lg:col-span-4"
            placeholder="הערות"
          />

          <button
            type="submit"
            className="rounded-2xl bg-[#f4e7c8] px-5 py-3 text-sm font-black text-slate-950 hover:bg-[#fff3d6]"
          >
            {isEditing ? "שמירת שינוי" : "הוסף פריט"}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-slate-200 hover:bg-white/[0.1]"
            >
              ביטול
            </button>
          )}
        </form>
      </details>

      <section className="rounded-[22px] bg-slate-800/58 p-3 text-right text-[#fff9ea] shadow-[0_12px_34px_rgba(2,6,23,0.18)]">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span className="w-fit rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-slate-300">
            גרירה ושינוי סדר: הכנה לשלב הבא
          </span>
          <div>
            <p className="mb-1 text-xs text-slate-400">
              {visibleItems.length} פריטים מוצגים
            </p>
            <h2 className="text-lg font-black">רשימות קניות</h2>
          </div>
        </div>

        <div className="mb-3 grid gap-3 md:grid-cols-2">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none placeholder:text-slate-500"
            placeholder="חיפוש פריט, מחלקה, קונה או הערה"
          />
          <select
            value={activeList}
            onChange={(event) => setActiveList(event.target.value)}
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-right text-[#fff9ea] outline-none"
          >
            <option value="all">כל הרשימות</option>
            {shoppingLists.map((listName) => (
              <option key={listName} value={listName}>
                {listName}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {displayedItems.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/[0.045] p-3.5 text-right"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => togglePurchased(item.id)}
                    className={
                      item.purchased
                        ? "rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                        : "rounded-xl bg-emerald-400/14 px-4 py-2 text-sm font-bold text-emerald-100"
                    }
                  >
                    {item.purchased ? "נרכש" : "סמן כנרכש"}
                  </button>
                  <button
                    type="button"
                    onClick={() => editItem(item)}
                    className="rounded-xl bg-sky-400/12 px-4 py-2 text-sm font-bold text-sky-100"
                  >
                    עריכה
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="rounded-xl bg-[#b86f68]/14 px-4 py-2 text-sm font-bold text-[#f0c6bd]"
                  >
                    מחיקה
                  </button>
                </div>

                <div className="max-w-3xl">
                  <div className="mb-2 flex flex-wrap justify-end gap-2 text-xs font-bold text-slate-300">
                    <span className="rounded-full bg-white/[0.07] px-3 py-1">
                      {item.listName}
                    </span>
                    <span className="rounded-full bg-white/[0.07] px-3 py-1">
                      {item.department}
                    </span>
                    <span className="rounded-full bg-white/[0.07] px-3 py-1">
                      {item.buyer}
                    </span>
                  </div>
                  <h3
                    className={
                      item.purchased
                        ? "text-base font-black text-slate-500 line-through"
                        : "text-base font-black text-white"
                    }
                  >
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    כמות: {item.quantity} · הערכה:{" "}
                    {item.estimatedPrice.toLocaleString("he-IL")} ₪
                    {item.notes ? ` · ${item.notes}` : ""}
                  </p>
                </div>
              </div>
            </article>
          ))}
          {visibleItems.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllItems((currentValue) => !currentValue)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-[#d7cfbf] hover:bg-white/[0.09]"
            >
              {showAllItems ? "הצג פחות" : `הצג עוד ${visibleItems.length - 5}`}
            </button>
          )}
        </div>
      </section>
    </section>
  );
}
