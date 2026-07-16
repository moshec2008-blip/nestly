import type { CloudMembership, MembershipRole } from "@/lib/cloud/schema";

const roleRank: Record<MembershipRole, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

export type FamilyCapability =
  | "familySpace.view"
  | "familySpace.edit"
  | "members.invite"
  | "members.remove"
  | "members.manageRoles"
  | "tasks.view"
  | "tasks.create"
  | "tasks.edit"
  | "tasks.assign"
  | "shopping.view"
  | "shopping.edit"
  | "finance.view"
  | "finance.edit"
  | "documents.view"
  | "documents.upload"
  | "vehicles.view"
  | "vehicles.edit"
  | "notes.viewShared"
  | "notes.manageOwn"
  | "timeline.view"
  | "settings.manage"
  | "permissions.manage";

const roleCapabilities: Record<MembershipRole, FamilyCapability[]> = {
  owner: [
    "familySpace.view",
    "familySpace.edit",
    "members.invite",
    "members.remove",
    "members.manageRoles",
    "tasks.view",
    "tasks.create",
    "tasks.edit",
    "tasks.assign",
    "shopping.view",
    "shopping.edit",
    "finance.view",
    "finance.edit",
    "documents.view",
    "documents.upload",
    "vehicles.view",
    "vehicles.edit",
    "notes.viewShared",
    "notes.manageOwn",
    "timeline.view",
    "settings.manage",
    "permissions.manage",
  ],
  admin: [
    "familySpace.view",
    "familySpace.edit",
    "members.invite",
    "tasks.view",
    "tasks.create",
    "tasks.edit",
    "tasks.assign",
    "shopping.view",
    "shopping.edit",
    "finance.view",
    "finance.edit",
    "documents.view",
    "documents.upload",
    "vehicles.view",
    "vehicles.edit",
    "notes.viewShared",
    "notes.manageOwn",
    "timeline.view",
    "settings.manage",
  ],
  member: [
    "familySpace.view",
    "tasks.view",
    "tasks.create",
    "tasks.edit",
    "tasks.assign",
    "shopping.view",
    "shopping.edit",
    "documents.view",
    "documents.upload",
    "vehicles.view",
    "notes.viewShared",
    "notes.manageOwn",
    "timeline.view",
  ],
  viewer: [
    "familySpace.view",
    "tasks.view",
    "shopping.view",
    "documents.view",
    "vehicles.view",
    "notes.viewShared",
    "timeline.view",
  ],
};

export function canAccessFamilySpace(
  membership: CloudMembership | null | undefined,
  familySpaceId: string
) {
  return Boolean(
    membership &&
      membership.familySpaceId === familySpaceId &&
      membership.status === "active"
  );
}

export function hasAtLeastRole(
  membership: CloudMembership | null | undefined,
  role: MembershipRole
) {
  if (!membership) {
    return false;
  }

  return roleRank[membership.role] >= roleRank[role];
}

export function can(
  membership: CloudMembership | null | undefined,
  capability: FamilyCapability,
  context?: { familySpaceId?: string }
) {
  if (!membership || membership.status !== "active") {
    return false;
  }

  if (context?.familySpaceId && membership.familySpaceId !== context.familySpaceId) {
    return false;
  }

  return roleCapabilities[membership.role]?.includes(capability) ?? false;
}

export function assertCapability(
  membership: CloudMembership | null | undefined,
  capability: FamilyCapability,
  context?: { familySpaceId?: string }
) {
  if (!can(membership, capability, context)) {
    throw new Error("capability-denied");
  }
}

export function assertFamilySpaceAccess(
  membership: CloudMembership | null | undefined,
  familySpaceId: string
) {
  if (!canAccessFamilySpace(membership, familySpaceId)) {
    throw new Error("family-space-access-denied");
  }
}

export function assertOwnerAccess(
  membership: CloudMembership | null | undefined
) {
  if (!hasAtLeastRole(membership, "owner")) {
    throw new Error("owner-access-required");
  }
}
