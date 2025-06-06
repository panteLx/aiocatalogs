"use client";

import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { useUserValidation } from "@/hooks/validation/use-user-validation";
import { api } from "@/trpc/react";
import { toast } from "@/hooks/ui/use-toast";

export default function UserPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const userId = params.userId as string;
  const utils = api.useUtils();

  const { isValidating, isValid, showLoader } = useUserValidation({
    userId,
    redirectOnInvalid: true,
    showToastOnError: true,
  });

  const createUserMutation = api.user.create.useMutation({
    onSuccess: (data, variables) => {
      toast({
        title: "Welcome!",
        description: "Your account has been set up successfully.",
      });
      // User is already on their dashboard, just refresh the data
      window.location.reload();
    },
    onError: (error) => {
      // If user already exists, that's fine - they're already on their dashboard
      if (
        error.message.includes("already exists") ||
        error.message.includes("CONFLICT")
      ) {
        // User already exists, no need to show error - just continue
        return;
      }
      toast({
        title: "Error",
        description: "Failed to set up your account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle case where Clerk user accesses their dashboard directly after auth
  useEffect(() => {
    if (isLoaded && user && userId === user.id && !isValidating) {
      // Check if user exists first, then create if needed
      const checkAndCreateUser = async () => {
        try {
          // Use the utils to fetch user existence
          const userExists = await utils.user.exists.fetch({ userId: user.id });

          if (!userExists) {
            // User doesn't exist, create them
            createUserMutation.mutate({ userId: user.id });
          }
          // If user exists, we don't need to do anything
        } catch (error) {
          console.error("Error checking user existence:", error);
          // If check fails, try to create user anyway (will handle duplicate gracefully)
          createUserMutation.mutate({ userId: user.id });
        }
      };

      checkAndCreateUser();
    }
  }, [isLoaded, user, userId, isValidating, utils, createUserMutation]);

  // Show loading state only if validation takes time
  if (isValidating && showLoader) {
    return (
      <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center pt-16">
        <div className="relative z-10 flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  // Show dashboard if user is valid
  if (isValid && userId) {
    return (
      <main className="relative min-h-screen flex-1 pt-16">
        <div className="container relative z-10 mx-auto px-4 py-8">
          <DashboardContent userId={userId} />
        </div>
      </main>
    );
  }

  // This shouldn't render as redirects happen in the hook,
  // but show a minimal loader for the brief moment before redirect
  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center pt-16">
      <div className="relative z-10 flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    </main>
  );
}
