import { beforeEach, describe, expect, it } from "vitest";
import { storageKeys } from "@/lib/storageKeys";
import {
  completeHandleQueueItem,
  getHandleQueueState,
  undoHandleQueueCompletion,
} from "@/services/handleQueue";
import {
  readStorageArray,
  setActiveStorageUserScope,
  writeStorage,
} from "@/utils/storage";
import type { FamilyTask } from "@/data/tasks";

beforeEach(() => {
  window.localStorage.clear();
  setActiveStorageUserScope("handle-test-family");
});

describe("handle queue direct completion", () => {
  it("records a real completion timestamp and can undo safely", () => {
    const task: FamilyTask = {
      id: "tax-form",
      title: "Upload tax form",
      description: "Keep the accountant moving.",
      owner: "Home",
      category: "Documents",
      priority: "high",
      status: "open",
      dueDate: "2026-07-19",
    };

    writeStorage(storageKeys.tasks, [task]);

    const completed = completeHandleQueueItem("task:tax-form");

    expect(completed.ok).toBe(true);

    const tasksAfterCompletion = readStorageArray<FamilyTask>(
      storageKeys.tasks,
      []
    );
    expect(tasksAfterCompletion[0]?.status).toBe("done");
    expect(tasksAfterCompletion[0]?.completedAt).toEqual(expect.any(String));

    const stateAfterCompletion = getHandleQueueState("en");
    expect(stateAfterCompletion.completedItems[0]).toMatchObject({
      id: "task:tax-form",
      completedAt: tasksAfterCompletion[0]?.completedAt,
    });

    if (!completed.ok) {
      throw new Error("Expected completion to provide an undo token");
    }

    expect(undoHandleQueueCompletion(completed.undoToken)).toBe(true);

    const tasksAfterUndo = readStorageArray<FamilyTask>(storageKeys.tasks, []);
    expect(tasksAfterUndo).toEqual([task]);
    expect(getHandleQueueState("en").items.some((item) => item.id === "task:tax-form")).toBe(
      true
    );
  });

  it("does not infer recently handled items from legacy done status alone", () => {
    writeStorage(storageKeys.tasks, [
      {
        id: "legacy-done",
        title: "Old done task",
        description: "No reliable completion time exists.",
        owner: "Home",
        category: "Tasks",
        priority: "medium",
        status: "done",
        dueDate: "2026-07-01",
      } satisfies FamilyTask,
    ]);

    expect(getHandleQueueState("en").completedItems).toEqual([]);
  });
});
