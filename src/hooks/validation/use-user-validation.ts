"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { toast } from "@/hooks/ui/use-toast";

interface UseUserValidationProps {
  userId: string | null;
  redirectOnInvalid?: boolean;
  showToastOnError?: boolean;
  enabled?: boolean;
}

interface UseUserValidationReturn {
  isValidating: boolean;
  isValid: boolean;
  showLoader: boolean;
}

export function useUserValidation({
  userId,
  redirectOnInvalid = true,
  showToastOnError = true,
  enabled = true,
}: UseUserValidationProps): UseUserValidationReturn {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const userExistsQuery = api.user.exists.useQuery(
    { userId: userId! },
    {
      enabled: !!userId && enabled,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 30000, // Consider data fresh for 30 seconds
      retry: 1, // Only retry once for faster failure
    },
  );

  useEffect(() => {
    if (!userId || !enabled) {
      if (!enabled) {
        // If validation is disabled, assume it's valid for now
        setIsValid(true);
        setIsValidating(false);
        setShowLoader(false);
        return;
      }

      if (redirectOnInvalid) {
        router.replace("/");
      }
      setIsValidating(false);
      return;
    }

    // Show loader only after a delay to prevent flash for fast responses
    const loaderTimeout = setTimeout(() => {
      if (isValidating) {
        setShowLoader(true);
      }
    }, 150);

    if (userExistsQuery.data !== undefined) {
      clearTimeout(loaderTimeout);
      setIsValidating(false);
      setShowLoader(false);

      if (userExistsQuery.data) {
        setIsValid(true);
      } else {
        setIsValid(false);
        if (redirectOnInvalid) {
          if (showToastOnError) {
            toast({
              title: "User not found",
              description: "The user ID does not exist.",
              variant: "destructive",
            });
          }
          router.replace("/");
        }
      }
    }

    if (userExistsQuery.error) {
      clearTimeout(loaderTimeout);
      setIsValidating(false);
      setShowLoader(false);
      setIsValid(false);

      if (redirectOnInvalid) {
        if (showToastOnError) {
          toast({
            title: "Error",
            description: "Failed to validate user. Please try again.",
            variant: "destructive",
          });
        }
        router.replace("/");
      }
    }

    return () => clearTimeout(loaderTimeout);
  }, [
    userId,
    enabled,
    userExistsQuery.data,
    userExistsQuery.error,
    router,
    isValidating,
    redirectOnInvalid,
    showToastOnError,
  ]);

  return {
    isValidating,
    isValid,
    showLoader,
  };
}
