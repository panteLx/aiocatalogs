"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { toast } from "@/hooks/use-toast";
import { generateUserId } from "@/lib/user-utils";
import { AuthButton } from "./auth-button";

export function NewUserForm() {
  const [isLoading, setIsLoading] = useState(false);
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
      setIsLoading(false);
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
      setIsLoading(false);
    },
  });

  const handleCreateUser = async () => {
    setIsLoading(true);
    const userId = generateUserId();
    createUserMutation.mutate({ userId });
  };

  return (
    <AuthButton
      onClick={handleCreateUser}
      isLoading={isLoading}
      loadingText="Creating..."
    >
      Generate New User ID
    </AuthButton>
  );
}
