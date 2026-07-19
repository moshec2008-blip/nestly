import { beforeEach, describe, expect, it } from "vitest";
import { storageKeys } from "@/lib/storageKeys";
import {
  getMemoryState,
  markMemoryItemViewed,
} from "@/services/memoryService";
import {
  setActiveStorageUserScope,
  writeStorage,
} from "@/utils/storage";
import type { FinanceTransaction } from "@/data/finance";
import type { BirthdayPerson } from "@/types/birthdays";

beforeEach(() => {
  window.localStorage.clear();
  setActiveStorageUserScope("memory-test-family");
});

describe("memory service", () => {
  it("searches across existing workspaces and groups by source workspace", () => {
    const birthday: BirthdayPerson = {
      id: "event-1",
      name: "Noa",
      relationship: "Daughter",
      eventType: "birthday",
      gregorianDate: "2010-04-18",
      hebrewDate: "",
      calendarType: "gregorian",
      reminders: ["week-before"],
      notes: "Wants headphones and a drawing kit.",
    };
    const transaction: FinanceTransaction = {
      id: "payment-1",
      title: "School trip payment",
      category: "Education",
      amount: 240,
      type: "expense",
      date: "2026-07-18",
      status: "done",
      completedAt: "2026-07-19T08:30:00.000Z",
      notes: "Paid for Noa headphones workshop trip",
    };

    writeStorage(storageKeys.birthdays, [birthday]);
    writeStorage(storageKeys.finance, [transaction]);

    const state = getMemoryState("headphones", "en");

    expect(state.total).toBeGreaterThanOrEqual(2);
    expect(state.groups.map((group) => group.domain)).toEqual(
      expect.arrayContaining(["birthdays", "finance"])
    );
    expect(state.items[0]?.matchScore).toBeGreaterThan(0);
  });

  it("tracks recently viewed items without changing source data", () => {
    writeStorage(storageKeys.finance, [
      {
        id: "payment-1",
        title: "Water bill",
        category: "Utilities",
        amount: 120,
        type: "expense",
        date: "2026-07-18",
        status: "done",
      } satisfies FinanceTransaction,
    ]);

    markMemoryItemViewed("finance:payment-1");

    const state = getMemoryState("", "en");

    expect(state.recentlyViewed[0]?.id).toBe("finance:payment-1");
    expect(state.recentlyViewed[0]?.title).toBe("Water bill");
  });

  it("uses real update timestamps for recently updated where available", () => {
    writeStorage(storageKeys.finance, [
      {
        id: "old-payment",
        title: "Old payment",
        category: "Utilities",
        amount: 80,
        type: "expense",
        date: "2026-06-01",
        status: "done",
        completedAt: "2026-06-10T08:00:00.000Z",
      },
      {
        id: "new-payment",
        title: "Recent payment",
        category: "Utilities",
        amount: 90,
        type: "expense",
        date: "2026-06-01",
        status: "done",
        completedAt: "2026-07-19T08:00:00.000Z",
      },
    ] satisfies FinanceTransaction[]);

    const state = getMemoryState("", "en");

    expect(state.recentlyUpdated[0]?.id).toBe("finance:new-payment");
  });
});
