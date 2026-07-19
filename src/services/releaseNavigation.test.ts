import { beforeEach, describe, expect, it } from "vitest";
import { storageKeys } from "@/lib/storageKeys";
import {
  getHandleQueueState,
} from "@/services/handleQueue";
import { getMemoryState } from "@/services/memoryService";
import {
  getNavigationItemLabel,
  isMoreActive,
  isRouteActive,
  releaseMoreNavigation,
  releaseNavigationRoutes,
  releasePrimaryNavigation,
  releaseWorkspaceNavigation,
} from "@/services/releaseNavigation";
import type { FinanceTransaction } from "@/data/finance";
import type { FamilyTask } from "@/data/tasks";
import type { AppRoute } from "@/types/navigation";
import { setActiveStorageUserScope, writeStorage } from "@/utils/storage";

const allAppRoutes: AppRoute[] = [
  "/",
  "/finance",
  "/tasks",
  "/handle",
  "/memory",
  "/assistant",
  "/timeline",
  "/life",
  "/health",
  "/documents",
  "/vehicles",
  "/family",
  "/knowledge",
  "/legacy",
  "/birthdays",
  "/shopping",
  "/security",
  "/permissions",
  "/settings",
];

beforeEach(() => {
  window.localStorage.clear();
  setActiveStorageUserScope("release-navigation-test-family");
});

describe("Release 1 navigation model", () => {
  it("prioritizes orientation, capture, action, retrieval, and more", () => {
    expect(releasePrimaryNavigation.map((item) => item.id)).toEqual([
      "home",
      "capture",
      "handle",
      "memory",
    ]);

    expect(releasePrimaryNavigation.map((item) => item.kind)).toEqual([
      "route",
      "action",
      "route",
      "route",
    ]);

    expect(getNavigationItemLabel(releasePrimaryNavigation[1], "he")).toBe(
      "הוסף"
    );
    expect(getNavigationItemLabel(releasePrimaryNavigation[3], "he")).toBe(
      "למצוא"
    );
  });

  it("moves module-first destinations into More", () => {
    const primaryRoutes = releasePrimaryNavigation
      .filter((item) => item.kind === "route")
      .map((item) => item.href);

    expect(primaryRoutes).toEqual(["/", "/handle", "/memory"]);
    expect(primaryRoutes).not.toEqual(
      expect.arrayContaining(["/tasks", "/shopping", "/finance"])
    );

    expect(releaseWorkspaceNavigation.map((item) => item.href)).toEqual(
      expect.arrayContaining([
        "/tasks",
        "/shopping",
        "/finance",
        "/documents",
        "/health",
        "/vehicles",
        "/family",
      ])
    );
  });

  it("reports active state for primary routes and More routes", () => {
    expect(isRouteActive("/", "/")).toBe(true);
    expect(isRouteActive("/handle", "/handle")).toBe(true);
    expect(isRouteActive("/handle/detail", "/handle")).toBe(true);
    expect(isRouteActive("/finance", "/")).toBe(false);
    expect(isMoreActive("/finance")).toBe(true);
    expect(isMoreActive("/memory")).toBe(false);
  });

  it("preserves access to every existing app route", () => {
    expect(releaseNavigationRoutes).toEqual(expect.arrayContaining(allAppRoutes));
  });

  it("keeps Handle source links pointed at the owning workspace", () => {
    writeStorage(storageKeys.tasks, [
      {
        id: "school-form",
        title: "School form",
        description: "Send the signed form.",
        owner: "Home",
        category: "School",
        priority: "high",
        status: "open",
        dueDate: "2026-07-19",
      } satisfies FamilyTask,
    ]);

    const state = getHandleQueueState("en");

    expect(state.items.find((item) => item.id === "task:school-form")).toMatchObject({
      href: "/tasks",
    });
  });

  it("keeps Memory source links pointed at the owning workspace", () => {
    writeStorage(storageKeys.finance, [
      {
        id: "water-bill",
        title: "Water bill",
        category: "Utilities",
        amount: 120,
        type: "expense",
        date: "2026-07-18",
        status: "done",
        notes: "Municipal water payment",
      } satisfies FinanceTransaction,
    ]);

    const state = getMemoryState("water", "en");

    expect(state.items.find((item) => item.id === "finance:water-bill")).toMatchObject({
      href: "/finance",
    });
  });

  it("keeps secondary concepts accessible but not primary", () => {
    const moreRoutes = releaseMoreNavigation.map((item) => item.href);
    const primaryIds = releasePrimaryNavigation.map((item) => item.id);

    expect(moreRoutes).toEqual(
      expect.arrayContaining([
        "/knowledge",
        "/timeline",
        "/life",
        "/legacy",
      ])
    );
    // המסכים הישנים נפרשו — אסור שיחזרו לניווט.
    expect(moreRoutes).not.toEqual(
      expect.arrayContaining(["/dashboard", "/command-center"])
    );
    expect(primaryIds).not.toEqual(
      expect.arrayContaining([
        "dashboard",
        "command-center",
        "knowledge",
        "timeline",
        "life",
        "legacy",
      ])
    );
  });
});
