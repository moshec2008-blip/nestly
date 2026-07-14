import type { CloudMembership, MembershipRole } from "@/lib/cloud/schema";

const roleRank: Record<MembershipRole, number> = {
  member: 1,
  owner: 2,
};

export function canAccessFamilySpace(
  membership: CloudMembership | null | undefined,
  familySpaceId: string
) {
  return Boolean(membership && membership.familySpaceId === familySpaceId);
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
