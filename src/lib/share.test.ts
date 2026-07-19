import { afterEach, describe, expect, it, vi } from "vitest";
import { shareFamilyText } from "@/lib/share";

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
