"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { toast } from "@/hooks/ui/use-toast";

export function useUserActions() {
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const router = useRouter();

  const createUserMutation = api.user.create.useMutation({
    onSuccess: async (data, variables) => {
      toast({
        title: "User created successfully",
        description: `Your new user ID is: ${variables.userId}`,
      });
      router.replace(`/${variables.userId}`);
      setIsCreatingUser(false);
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create user. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsCreatingUser(false);
    },
  });

  const handleCreateNewUser = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);

    // Use Clerk SignInButton modal instead of redirect
    // This will be handled by the component directly
  };

  const handleShowExistingUserModal = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Use Clerk SignInButton modal instead of redirect
    // This will be handled by the component directly
  };

  return {
    isCreatingUser,
    handleCreateNewUser,
    handleShowExistingUserModal,
  };
}
