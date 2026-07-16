const finalHebrewLetters: Record<string, string> = {
  ך: "כ",
  ם: "מ",
  ן: "נ",
  ף: "פ",
  ץ: "צ",
};

export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[ךםןףץ]/g, (letter) => finalHebrewLetters[letter] ?? letter)
    .replace(/[₪$€£]/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeSearchText(value: string) {
  return normalizeSearchText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

export function matchesSearchQuery(query: string, values: Array<string | number | undefined>) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return false;
  }

  const queryTokens = tokenizeSearchText(normalizedQuery);
  const haystack = normalizeSearchText(values.map((value) => value ?? "").join(" "));

  return queryTokens.every((token) => haystack.includes(token));
}

export function scoreSearchMatch(query: string, title: string, text: string) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedTitle = normalizeSearchText(title);
  const normalizedText = normalizeSearchText(text);

  if (!normalizedQuery) {
    return 0;
  }

  if (normalizedTitle === normalizedQuery) {
    return 100;
  }

  if (normalizedTitle.startsWith(normalizedQuery)) {
    return 82;
  }

  if (normalizedTitle.includes(normalizedQuery)) {
    return 68;
  }

  const tokens = tokenizeSearchText(normalizedQuery);
  const matchedTokens = tokens.filter((token) => normalizedText.includes(token));

  return matchedTokens.length * 14;
}
