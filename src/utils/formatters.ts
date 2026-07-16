export function formatHebrewDateLabel(date: string | Date) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatShortHebrewDateLabel(date: string | Date) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(date));
}

const ilsCurrencyFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

export function formatIlsCurrency(amount: number) {
  return ilsCurrencyFormatter.format(amount);
}

export function formatSignedIlsCurrency(
  amount: number,
  type: "income" | "expense"
) {
  const sign = type === "income" ? "+" : "-";
  return `${sign}\u00a0${formatIlsCurrency(Math.abs(amount))}`;
}

export function formatAccessibleSignedIlsCurrency(
  amount: number,
  type: "income" | "expense"
) {
  const directionLabel = type === "income" ? "הכנסה" : "הוצאה";
  return `${directionLabel}: ${formatIlsCurrency(Math.abs(amount))}`;
}
