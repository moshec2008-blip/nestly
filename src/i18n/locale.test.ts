import { describe, expect, it } from "vitest";
import { getLocale } from "@/i18n/locale";

describe("getLocale", () => {
  it("maps English to en-US", () => {
    expect(getLocale("en")).toBe("en-US");
  });

  it("maps Hebrew and any not-yet-ready language to he-IL", () => {
    expect(getLocale("he")).toBe("he-IL");
    expect(getLocale("fr")).toBe("he-IL");
    expect(getLocale("ru")).toBe("he-IL");
  });
});
