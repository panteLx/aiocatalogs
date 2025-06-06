"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function AuthRedirect() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Reset redirect flag when user changes
    if (!user) {
      hasRedirected.current = false;
    }
  }, [user]);

  useEffect(() => {
    // Only replace route once per session when user signs in
    if (
      isLoaded &&
      user &&
      !hasRedirected.current &&
      window.location.pathname === "/"
    ) {
      hasRedirected.current = true;
      router.replace(`/${user.id}`);
    }
  }, [user, isLoaded, router]);

  return null;
}
