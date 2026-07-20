import { describe, expect, it } from "vitest";
import { nowIso } from "@/utils/dateTime";

describe("nowIso", () => {
  it("returns a valid ISO 8601 timestamp", () => {
    const value = nowIso();

    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(value).toISOString()).toBe(value);
  });
});
