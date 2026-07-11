"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  clearActiveStorageUserScope,
  setActiveStorageUserScope,
} from "@/utils/storage";

export default function AuthStorageScope() {
  const { data: session, status } = useSession();
  const userScope =
    session?.user?.email || session?.user?.id || session?.user?.name || "";

  useEffect(() => {
    if (status === "authenticated" && userScope) {
      setActiveStorageUserScope(userScope);
      return;
    }

    if (status === "unauthenticated") {
      clearActiveStorageUserScope();
    }
  }, [status, userScope]);

  return null;
}
