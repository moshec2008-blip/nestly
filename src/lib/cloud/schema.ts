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

export type MembershipRole = "owner" | "member";

export type CloudUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CloudFamilySpace = {
  id: string;
  name: string;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type CloudMembership = {
  id: string;
  userId: string;
  familySpaceId: string;
  role: MembershipRole;
  createdAt: string;
  updatedAt: string;
};

export type FamilyScopedRecord<TData = unknown> = {
  id: string;
  familySpaceId: string;
  kind: CloudEntityKind;
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
