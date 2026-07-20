import { describe, expect, it } from "vitest";
import {
  deleteAttachmentData,
  getAttachmentData,
  saveAttachmentData,
} from "@/lib/attachmentStore";

// jsdom (the test environment) does not implement IndexedDB — this exercises
// exactly the "unsupported context" path that real browsers can also hit.
describe("attachmentStore without IndexedDB support", () => {
  it("save rejects clearly instead of throwing an unhandled TypeError", async () => {
    await expect(saveAttachmentData("id-1", "data:url")).rejects.toThrow(
      "indexeddb-unsupported"
    );
  });

  it("get resolves to null so callers can fall back gracefully", async () => {
    await expect(getAttachmentData("id-1")).resolves.toBeNull();
  });

  it("delete resolves without throwing even for multiple ids", async () => {
    await expect(
      deleteAttachmentData(["id-1", "id-2"])
    ).resolves.toBeUndefined();
  });
});
