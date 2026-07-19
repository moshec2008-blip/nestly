// מזהים ייחודיים שעובדים בכל הקשר — כולל הקשר לא-מאובטח (גישה מהטלפון
// דרך IP ברשת הביתית, http://10.0.0.x), שבו crypto.randomUUID אינו קיים.

export function createUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  // fallback: זמן + אקראיות — ייחודיות מספקת למזהים מקומיים.
  const randomPart = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${randomPart()}-${randomPart()}`;
}
