"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { toast } from "@/hooks/use-toast";
import { validateUserId } from "@/lib/user-utils";
import { AuthButton } from "./auth-button";

export function ExistingUserForm() {
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const utils = api.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsLoading(true);

    try {
      const exists = await utils.user.exists.fetch({ userId: trimmedUserId });

      if (exists) {
        // Prefetch the user data again to warm the cache for instant dashboard load
        utils.user.exists.prefetch({ userId: trimmedUserId });
        router.replace(`/${trimmedUserId}`);
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
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="userId" className="text-white">
          User ID
        </Label>
        <Input
          id="userId"
          name="userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter your user ID"
          required
          disabled={isLoading}
          className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
        />
      </div>
      <AuthButton
        type="submit"
        isLoading={isLoading}
        loadingText="Checking..."
        disabled={!userId.trim()}
      >
        Continue
      </AuthButton>
    </form>
  );
}
