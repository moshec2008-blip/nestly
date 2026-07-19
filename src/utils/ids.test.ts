import { afterEach, describe, expect, it, vi } from "vitest";
import { createUuid } from "@/utils/ids";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createUuid", () => {
  it("uses crypto.randomUUID when available", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "uuid-from-crypto" });

    expect(createUuid()).toBe("uuid-from-crypto");
  });

  it("falls back safely when crypto.randomUUID is missing (insecure context)", () => {
    // כמו גישה מהטלפון דרך http://10.0.0.x — אין randomUUID.
    vi.stubGlobal("crypto", {});

    const first = createUuid();
    const second = createUuid();

    expect(first).toBeTruthy();
    expect(second).toBeTruthy();
    expect(first).not.toBe(second);
  });

  it("generates unique ids across many calls in fallback mode", () => {
    vi.stubGlobal("crypto", {});

    const ids = new Set(Array.from({ length: 500 }, () => createUuid()));

    expect(ids.size).toBe(500);
  });
});
