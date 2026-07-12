"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  clearActiveFamilySpace,
  ensureDefaultFamilySpace,
} from "@/lib/familySpace";
import {
  clearActiveStorageUserScope,
  setActiveStorageUserScope,
} from "@/utils/storage";

export default function AuthStorageScope() {
  const { data: session, status } = useSession();
  const accountKey =
    session?.user?.email || session?.user?.id || session?.user?.name || "";

  useEffect(() => {
    if (status === "authenticated" && accountKey) {
      const familySpace = ensureDefaultFamilySpace(
        accountKey,
        session?.user?.name
      );

      if (familySpace) {
        setActiveStorageUserScope(familySpace.id);
      }

      return;
    }

    if (status === "unauthenticated") {
      clearActiveFamilySpace();
      clearActiveStorageUserScope();
    }
  }, [accountKey, session?.user?.name, status]);

  return null;
}
