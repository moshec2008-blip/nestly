export type NestlyUserProfile = {
  accountKey: string;
  displayName: string;
  email?: string | null;
  image?: string | null;
  hasChosenDisplayName: boolean;
  createdAt: string;
  updatedAt: string;
};

const userProfileEventName = "nestly-user-profile-change";

function normalizeAccountKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_");
}

function getUserProfileKey(accountKey: string) {
  return `nestly:account:${normalizeAccountKey(accountKey)}:profile`;
}

function getFallbackDisplayName(name?: string | null, email?: string | null) {
  const trimmedName = name?.trim();

  if (trimmedName) {
    return trimmedName;
  }

  const emailName = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return emailName || "משתמש Nestly";
}

export function getUserProfileEventName() {
  return userProfileEventName;
}

export function readUserProfile(accountKey: string) {
  if (typeof window === "undefined" || !accountKey) {
    return null;
  }

  const rawValue = window.localStorage.getItem(getUserProfileKey(accountKey));

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as NestlyUserProfile;
  } catch {
    window.localStorage.removeItem(getUserProfileKey(accountKey));
    return null;
  }
}

export function ensureUserProfile(input: {
  accountKey: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  if (typeof window === "undefined" || !input.accountKey) {
    return null;
  }

  const existingProfile = readUserProfile(input.accountKey);
  const timestamp = new Date().toISOString();

  if (existingProfile) {
    const updatedProfile: NestlyUserProfile = {
      ...existingProfile,
      email: input.email ?? existingProfile.email,
      image: input.image ?? existingProfile.image,
      updatedAt: timestamp,
    };

    window.localStorage.setItem(
      getUserProfileKey(input.accountKey),
      JSON.stringify(updatedProfile)
    );
    window.dispatchEvent(new CustomEvent(userProfileEventName));
    return updatedProfile;
  }

  const createdProfile: NestlyUserProfile = {
    accountKey: normalizeAccountKey(input.accountKey),
    displayName: getFallbackDisplayName(input.name, input.email),
    email: input.email,
    image: input.image,
    hasChosenDisplayName: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  window.localStorage.setItem(
    getUserProfileKey(input.accountKey),
    JSON.stringify(createdProfile)
  );
  window.dispatchEvent(new CustomEvent(userProfileEventName));
  return createdProfile;
}

export function updateUserDisplayName(accountKey: string, displayName: string) {
  if (typeof window === "undefined" || !accountKey) {
    return null;
  }

  const currentProfile =
    readUserProfile(accountKey) ??
    ensureUserProfile({
      accountKey,
      name: displayName,
    });

  if (!currentProfile) {
    return null;
  }

  const nextProfile: NestlyUserProfile = {
    ...currentProfile,
    displayName: displayName.trim() || currentProfile.displayName,
    hasChosenDisplayName: true,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    getUserProfileKey(accountKey),
    JSON.stringify(nextProfile)
  );
  window.dispatchEvent(new CustomEvent(userProfileEventName));
  return nextProfile;
}
