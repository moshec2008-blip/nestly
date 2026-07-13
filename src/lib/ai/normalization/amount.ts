import type { CurrencyCode, MoneyAmount } from "@/lib/ai/types";

const currencySymbols: Record<string, CurrencyCode> = {
  "₪": "ILS",
  "$": "USD",
  "€": "EUR",
};

export function detectCurrency(value: string, fallback: CurrencyCode = "ILS") {
  const symbol = Object.keys(currencySymbols).find((item) =>
    value.includes(item)
  );

  if (symbol) {
    return currencySymbols[symbol];
  }

  if (/\bils\b/i.test(value) || /\bnis\b/i.test(value)) {
    return "ILS";
  }

  if (/\busd\b/i.test(value)) {
    return "USD";
  }

  if (/\beur\b/i.test(value)) {
    return "EUR";
  }

  return fallback;
}

export function normalizeAmount(
  value: string | number | null | undefined,
  fallbackCurrency: CurrencyCode = "ILS"
): MoneyAmount | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const raw = String(value).trim();
  const currency = detectCurrency(raw, fallbackCurrency);
  const cleaned = raw.replace(/[^\d,.-]/g, "");

  if (!cleaned) {
    return undefined;
  }

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalSeparator =
    lastComma > lastDot ? "," : lastDot > lastComma ? "." : null;
  const normalized =
    decimalSeparator === ","
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(/,/g, "");
  const numericValue = Number(normalized);

  if (!Number.isFinite(numericValue)) {
    return undefined;
  }

  return {
    value: numericValue,
    minorUnits: Math.round(numericValue * 100),
    currency,
  };
}

export function formatMoneyForReview(amount?: MoneyAmount) {
  if (!amount) {
    return "לא זוהה";
  }

  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: amount.currency || "ILS",
    maximumFractionDigits: 2,
  }).format(amount.value);
}
