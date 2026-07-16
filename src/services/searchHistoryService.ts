const recentSearchesKey = "nestly-command-palette-recent-searches";
const maxRecentSearches = 8;

function readRecentSearchesFromStorage() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsedValue = JSON.parse(
      window.localStorage.getItem(recentSearchesKey) ?? "[]"
    );
    return Array.isArray(parsedValue)
      ? parsedValue.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeRecentSearches(searches: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    recentSearchesKey,
    JSON.stringify(searches.slice(0, maxRecentSearches))
  );
}

export function getRecentSearches() {
  return readRecentSearchesFromStorage();
}

export function saveRecentSearch(query: string) {
  const cleanQuery = query.trim().slice(0, 80);

  if (cleanQuery.length < 2) {
    return;
  }

  writeRecentSearches([
    cleanQuery,
    ...readRecentSearchesFromStorage().filter((item) => item !== cleanQuery),
  ]);
}

export function removeRecentSearch(query: string) {
  writeRecentSearches(
    readRecentSearchesFromStorage().filter((item) => item !== query)
  );
}

export function clearRecentSearches() {
  writeRecentSearches([]);
}
