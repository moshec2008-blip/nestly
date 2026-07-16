export type CloudEntityKind =
  | "settings"
  | "task"
  | "shopping_item"
  | "finance_metadata"
  | "document_metadata"
  | "vehicle_record"
  | "health_record"
  | "family_event"
  | "family_member";

export type MembershipRole = "owner" | "admin" | "member" | "viewer";
export type FamilySpaceStatus = "active" | "suspended" | "archived";
export type UserProfileStatus = "active" | "disabled";
export type MembershipStatus = "active" | "pending" | "suspended" | "left";
export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";
export type RecordVisibility = "private" | "family" | "selected_members";

export type CloudUser = {
  id: string;
  authProviderId?: string;
  email: string;
  name?: string | null;
  image?: string | null;
  locale?: string;
  timezone?: string;
  lastSeenAt?: string;
  status: UserProfileStatus;
  personalPreferences?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CloudFamilySpace = {
  id: string;
  name: string;
  slug?: string;
  ownerUserId: string;
  status: FamilySpaceStatus;
  defaultLocale: string;
  defaultCurrency: string;
  timezone: string;
  plan?: string;
  settings?: Record<string, unknown>;
  onboardingCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CloudMembership = {
  id: string;
  userId: string;
  familySpaceId: string;
  linkedFamilyMemberId?: string;
  role: MembershipRole;
  status: MembershipStatus;
  invitedByUserId?: string;
  joinedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CloudInvitation = {
  id: string;
  familySpaceId: string;
  email: string;
  role: MembershipRole;
  invitedByUserId: string;
  tokenHash: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptedByUserId?: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type FamilyScopedRecord<TData = unknown> = {
  id: string;
  familySpaceId: string;
  kind: CloudEntityKind;
  visibility: RecordVisibility;
  ownerUserId?: string;
  data: TData;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type CloudBootstrapResult = {
  user: CloudUser;
  familySpace: CloudFamilySpace;
  membership: CloudMembership;
  isFirstLogin: boolean;
};

export type GuestMigrationDecision = "import" | "start_fresh";

export type GuestMigrationRecord = {
  id: string;
  userId: string;
  familySpaceId: string;
  decision: GuestMigrationDecision;
  migratedKinds: CloudEntityKind[];
  createdAt: string;
};
