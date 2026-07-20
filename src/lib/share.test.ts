import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatShareListMessage,
  shareFamilyText,
  shareFamilyTextByEmail,
} from "@/lib/share";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("shareFamilyText", () => {
  it("prefers the device share sheet when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });

    const outcome = await shareFamilyText("רשימת קניות", "כותרת");

    expect(outcome).toBe("shared");
    expect(share).toHaveBeenCalledWith({ text: "רשימת קניות", title: "כותרת" });
  });

  it("reports cancelled when the user closes the share sheet", async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("cancelled", "AbortError"));
    vi.stubGlobal("navigator", { share });

    expect(await shareFamilyText("טקסט")).toBe("cancelled");
  });

  it("falls back to WhatsApp when the share sheet is unavailable", async () => {
    vi.stubGlobal("navigator", {});
    const openSpy = vi
      .spyOn(window, "open")
      .mockReturnValue({} as Window);

    const outcome = await shareFamilyText("חלב ולחם");

    expect(outcome).toBe("whatsapp");
    expect(openSpy).toHaveBeenCalledWith(
      `https://wa.me/?text=${encodeURIComponent("חלב ולחם")}`,
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("reports failure when the WhatsApp window is blocked", async () => {
    vi.stubGlobal("navigator", {});
    vi.spyOn(window, "open").mockReturnValue(null);

    expect(await shareFamilyText("טקסט")).toBe("failed");
  });
});

describe("shareFamilyTextByEmail", () => {
  let originalLocation: Location;
  let locationStub: { href: string };

  beforeEach(() => {
    originalLocation = window.location;
    locationStub = { href: "" };
    Object.defineProperty(window, "location", {
      value: locationStub,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  it("opens a mailto link with the encoded subject and body", () => {
    const outcome = shareFamilyTextByEmail("כותרת", "שורה 1\nשורה 2");

    expect(outcome).toBe("opened");
    expect(locationStub.href).toBe(
      `mailto:?subject=${encodeURIComponent("כותרת")}&body=${encodeURIComponent("שורה 1\nשורה 2")}`
    );
  });

  it("truncates a very long body instead of producing a broken link", () => {
    const longBody = "פריט ".repeat(1000);

    shareFamilyTextByEmail("רשימה ארוכה", longBody);

    const encodedBody = locationStub.href.split("body=")[1];
    expect(decodeURIComponent(encodedBody).length).toBeLessThan(longBody.length);
  });
});

describe("formatShareListMessage", () => {
  const items = [
    { title: "חלב", quantity: 1 },
    { title: "ביצים", quantity: 2 },
  ];

  it("bolds the title for WhatsApp using its own markdown", () => {
    const message = formatShareListMessage(items, "רשימת קניות", "whatsapp");

    expect(message).toContain("*רשימת קניות*");
    expect(message).toContain("▫️ חלב");
    expect(message).toContain("▫️ ביצים ×2");
  });

  it("keeps the title plain for email so no literal asterisks show up", () => {
    const message = formatShareListMessage(items, "רשימת קניות", "plain");

    expect(message).not.toContain("*");
    expect(message).toContain("רשימת קניות");
  });

  it("uses singular phrasing for exactly one item", () => {
    const message = formatShareListMessage(
      [{ title: "לחם", quantity: 1 }],
      "רשימה",
      "plain"
    );

    expect(message).toContain("פריט אחד לקנייה");
  });
});
