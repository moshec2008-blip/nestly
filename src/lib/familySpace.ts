export type FamilySpace = {
  id: string;
  name: string;
  ownerUserKey: string;
  createdAt: string;
};

const activeFamilySpaceStorageKey = "nestly-active-family-space";
const familySpaceEventName = "nestly-family-space-change";

function normalizeAccountKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_");
}

function getAccountSpacesKey(accountKey: string) {
  return `nestly:account:${normalizeAccountKey(accountKey)}:family-spaces`;
}

function createSpaceId(accountKey: string) {
  return `space_${normalizeAccountKey(accountKey)}_${Date.now()}`;
}

function getDefaultFamilySpaceName(userName?: string | null) {
  if (!userName) {
    return "המרחב המשפחתי שלי";
  }

  const firstName = userName.trim().split(" ").filter(Boolean)[0];
  return firstName ? `המרחב המשפחתי של ${firstName}` : "המרחב המשפחתי שלי";
}

function readFamilySpaces(accountKey: string): FamilySpace[] {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(getAccountSpacesKey(accountKey));

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? (parsedValue as FamilySpace[]) : [];
  } catch {
    return [];
  }
}

function writeFamilySpaces(accountKey: string, spaces: FamilySpace[]) {
  window.localStorage.setItem(
    getAccountSpacesKey(accountKey),
    JSON.stringify(spaces)
  );
}

export function getFamilySpaceEventName() {
  return familySpaceEventName;
}

export function getActiveFamilySpace(): FamilySpace | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(activeFamilySpaceStorageKey);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as FamilySpace;
  } catch {
    window.localStorage.removeItem(activeFamilySpaceStorageKey);
    return null;
  }
}

export function ensureDefaultFamilySpace(
  accountKey: string,
  userName?: string | null
) {
  if (typeof window === "undefined") {
    return null;
  }

  const spaces = readFamilySpaces(accountKey);
  const existingSpace = spaces[0];

  if (existingSpace) {
    window.localStorage.setItem(
      activeFamilySpaceStorageKey,
      JSON.stringify(existingSpace)
    );
    window.dispatchEvent(new CustomEvent(familySpaceEventName));
    return existingSpace;
  }

  const createdSpace: FamilySpace = {
    id: createSpaceId(accountKey),
    name: getDefaultFamilySpaceName(userName),
    ownerUserKey: normalizeAccountKey(accountKey),
    createdAt: new Date().toISOString(),
  };

  writeFamilySpaces(accountKey, [createdSpace]);
  window.localStorage.setItem(
    activeFamilySpaceStorageKey,
    JSON.stringify(createdSpace)
  );
  window.dispatchEvent(new CustomEvent(familySpaceEventName));
  return createdSpace;
}

export function clearActiveFamilySpace() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(activeFamilySpaceStorageKey);
  window.dispatchEvent(new CustomEvent(familySpaceEventName));
}
