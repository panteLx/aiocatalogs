"use client";

import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { useUserValidation } from "@/hooks/validation/use-user-validation";
import { api } from "@/trpc/react";
import { toast } from "@/hooks/ui/use-toast";

export default function UserPage() {
  const params = useParams();
  const { user, isLoaded } = useUser();
  const userId = params.userId as string;
  const utils = api.useUtils();

  // Use ref to track if we've already attempted to create user for this session
  const userCreationAttempted = useRef(false);
  const userCreationCompleted = useRef(false);
  const [, setIsCreatingUser] = useState(false);
  const [validationEnabled, setValidationEnabled] = useState(false);

  // Only start validation after user creation is completed for new users
  // If it's the current user and they haven't been created yet, disable validation
  const isCurrentUser = isLoaded && user && userId === user.id;

  const { isValid } = useUserValidation({
    userId,
    redirectOnInvalid: true,
    showToastOnError: true,
    // Disable validation if it's the current user and creation is completed
    enabled:
      validationEnabled && !(isCurrentUser && userCreationCompleted.current),
  });

  const createUserMutation = api.user.create.useMutation({
    onSuccess: async (data, variables) => {
      // Mark user creation as completed
      userCreationCompleted.current = true;
      setIsCreatingUser(false);

      if (data.alreadyExists) {
        console.log("User already existed - continuing to dashboard");
      } else {
        toast({
          title: "Welcome!",
          description: "Your account has been set up successfully.",
        });
      }

      // Invalidate the user exists query and wait for it to complete
      await utils.user.exists.invalidate({ userId: variables.userId });

      // Add a small delay to ensure cache invalidation is processed
      setTimeout(() => {
        // Enable validation after cache has been properly invalidated
        setValidationEnabled(true);
      }, 100);
    },
    onError: (error) => {
      console.error("Error creating user:", error);
      // Mark as completed even on error to allow validation to proceed
      userCreationCompleted.current = true;
      setIsCreatingUser(false);
      // Enable validation even on error with a small delay
      setTimeout(() => {
        setValidationEnabled(true);
      }, 100);
      toast({
        title: "Error",
        description: "Failed to set up your account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle case where Clerk user accesses their dashboard directly after auth
  useEffect(() => {
    if (
      isLoaded &&
      user &&
      userId === user.id &&
      !userCreationAttempted.current
    ) {
      // Mark that we've attempted user creation to prevent multiple attempts
      userCreationAttempted.current = true;

      // Check if user exists first, then create if needed
      const checkAndCreateUser = async () => {
        try {
          setIsCreatingUser(true);
          // Use the utils to fetch user existence
          const userExists = await utils.user.exists.fetch({ userId: user.id });

          if (!userExists) {
            // User doesn't exist, create them
            console.log("User doesn't exist, creating...");
            createUserMutation.mutate({ userId: user.id });
          } else {
            console.log("User already exists");
            // Mark as completed since user already exists
            userCreationCompleted.current = true;
            setIsCreatingUser(false);
            // Enable validation since user already exists
            setValidationEnabled(true);
          }
        } catch (error) {
          console.error("Error checking user existence:", error);
          // If check fails, try to create user anyway (will handle duplicate gracefully)
          createUserMutation.mutate({ userId: user.id });
        }
      };

      void checkAndCreateUser();
    }

    // For users that are not the current user, enable validation immediately
    if (isLoaded && (!user || userId !== user.id)) {
      setValidationEnabled(true);
    }

    // Don't include createUserMutation in dependencies to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user, userId, utils]);

  // Show dashboard if user is valid OR if it's the current user and creation is completed successfully
  if ((isValid && userId) || (isCurrentUser && userCreationCompleted.current)) {
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
