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

// תוכנית הדואר של המכשיר — בלי שרת, בלי חשבון. mailto: מוגבל באורך אצל
// חלק מהלקוחות, אז חותכים גוף ארוך מדי כדי שהקישור לא ייכשל בשקט.
const mailtoMaxBodyLength = 1_600;

export function shareFamilyTextByEmail(
  subject: string,
  body: string
): "opened" | "failed" {
  if (typeof window === "undefined") {
    return "failed";
  }

  const trimmedBody =
    body.length > mailtoMaxBodyLength
      ? `${body.slice(0, mailtoMaxBodyLength)}\n…`
      : body;

  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(trimmedBody)}`;

  try {
    window.location.href = mailtoUrl;
    return "opened";
  } catch {
    return "failed";
  }
}

export type ShareListItem = {
  title: string;
  quantity: number;
};

// מבנה טקסט אחיד לשיתוף רשימה: וואטסאפ תומך ב-*הדגשה*, אימייל רגיל מציג
// כוכביות כפשוטן — לכן ה-markdown מופעל רק בערוץ שתומך בו.
export function formatShareListMessage(
  items: ShareListItem[],
  listTitle: string,
  format: "whatsapp" | "plain"
): string {
  const bold = (text: string) => (format === "whatsapp" ? `*${text}*` : text);
  const countLabel =
    items.length === 1 ? "פריט אחד לקנייה" : `${items.length} פריטים לקנייה`;
  const lines = items.map((item) => {
    const quantitySuffix = item.quantity > 1 ? ` ×${item.quantity}` : "";
    return `▫️ ${item.title}${quantitySuffix}`;
  });

  return [
    `🛒 ${bold(listTitle)}`,
    countLabel,
    "",
    ...lines,
    "",
    "נשלח מ-Nestly 🏠",
  ].join("\n");
}
