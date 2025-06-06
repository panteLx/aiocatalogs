"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { toast } from "@/hooks/ui/use-toast";
import { generateUserId, validateUserId } from "@/lib/utils/user";

export function useUserActions() {
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showExistingUserModal, setShowExistingUserModal] = useState(false);
  const [userId, setUserId] = useState("");
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const router = useRouter();
  const utils = api.useUtils();

  const createUserMutation = api.user.create.useMutation({
    onSuccess: (data, variables) => {
      toast({
        title: "User created successfully",
        description: `Your new user ID is: ${variables.userId}`,
      });
      // Prefetch the user existence check to warm the cache
      void utils.user.exists.prefetch({ userId: variables.userId });
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
    const userId = generateUserId();
    createUserMutation.mutate({ userId });
  };

  const handleShowExistingUserModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowExistingUserModal(true);
  };

  const handleCloseModal = () => {
    setShowExistingUserModal(false);
    setUserId("");
  };

  const handleExistingUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUserId = userId.trim();

    if (!trimmedUserId) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid user ID.",
        variant: "destructive",
      });
      return;
    }

    if (!validateUserId(trimmedUserId)) {
      toast({
        title: "Invalid format",
        description:
          "User ID must be 3-50 characters long and contain only letters and numbers.",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingUser(true);

    try {
      const exists = await utils.user.exists.fetch({ userId: trimmedUserId });

      if (exists) {
        // Prefetch the user data again to warm the cache for instant dashboard load
        void utils.user.exists.prefetch({ userId: trimmedUserId });
        router.replace(`/${trimmedUserId}`);
        setShowExistingUserModal(false);
        setUserId("");
      } else {
        toast({
          title: "User not found",
          description:
            "The user ID you entered does not exist. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCheckingUser(false);
    }
  };

  return {
    isCreatingUser,
    showExistingUserModal,
    userId,
    isCheckingUser,
    setUserId,
    handleCreateNewUser,
    handleShowExistingUserModal,
    handleCloseModal,
    handleExistingUserSubmit,
  };
}
