export type SmartCollectionVisibility = "family" | "private" | "admins";

export type SmartCollectionRule = {
  id: string;
  entityType?: string;
  relatedEntityId?: string;
  category?: string;
  tag?: string;
  familyMemberId?: string;
  vehicleId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  visibility?: SmartCollectionVisibility;
};

export type SmartCollection = {
  id: string;
  familySpaceId: string;
  title: string;
  description?: string;
  icon: string;
  rules: SmartCollectionRule[];
  manuallyPinnedEntities: Array<{ entityType: string; entityId: string }>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  visibility: SmartCollectionVisibility;
  sortOrder: number;
  favorite: boolean;
  archived: boolean;
};
