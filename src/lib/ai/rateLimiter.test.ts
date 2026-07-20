import { describe, expect, it, vi } from "vitest";
import { getClientKeyFromRequest, isRateLimited } from "@/lib/ai/rateLimiter";

function requestFrom(ip: string) {
  return new Request("http://localhost/api/ai/test", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("getClientKeyFromRequest", () => {
  it("takes the first IP from a forwarded chain", () => {
    expect(getClientKeyFromRequest(requestFrom("1.2.3.4, 5.6.7.8"))).toBe(
      "1.2.3.4"
    );
  });

  it("falls back to 'unknown' when the header is missing", () => {
    expect(getClientKeyFromRequest(new Request("http://localhost/"))).toBe(
      "unknown"
    );
  });
});

describe("isRateLimited", () => {
  it("allows the first 10 requests in a window and blocks the 11th", () => {
    const clientKey = `test-client-${Math.random()}`;

    for (let i = 0; i < 10; i += 1) {
      expect(isRateLimited(clientKey)).toBe(false);
    }

    expect(isRateLimited(clientKey)).toBe(true);
  });

  it("resets after the rate window passes", () => {
    vi.useFakeTimers();
    const clientKey = `test-client-${Math.random()}`;

    try {
      for (let i = 0; i < 10; i += 1) {
        isRateLimited(clientKey);
      }
      expect(isRateLimited(clientKey)).toBe(true);

      vi.advanceTimersByTime(61_000);

      expect(isRateLimited(clientKey)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("tracks separate clients independently", () => {
    const clientA = `client-a-${Math.random()}`;
    const clientB = `client-b-${Math.random()}`;

    for (let i = 0; i < 10; i += 1) {
      isRateLimited(clientA);
    }

    expect(isRateLimited(clientA)).toBe(true);
    expect(isRateLimited(clientB)).toBe(false);
  });
});
