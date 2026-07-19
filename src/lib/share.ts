// שיתוף טקסט משפחתי בלי שרת: קודם מנגנון השיתוף של המכשיר (מובייל),
// ואם אין — פתיחת וואטסאפ ישירות. משתמש בהרגל הקיים במקום להתחרות בו.

export type ShareOutcome = "shared" | "whatsapp" | "cancelled" | "failed";

export async function shareFamilyText(
  text: string,
  title?: string
): Promise<ShareOutcome> {
  if (typeof window === "undefined") {
    return "failed";
  }

  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share({ text, title });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return "cancelled";
      }
      // מנגנון השיתוף נכשל — ממשיכים לוואטסאפ.
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const openedWindow = window.open(whatsappUrl, "_blank", "noopener,noreferrer");

  return openedWindow ? "whatsapp" : "failed";
}
