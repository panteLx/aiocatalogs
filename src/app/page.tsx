"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, LogIn, ArrowRight, Shield, Loader2, X } from "lucide-react";
import { api } from "@/trpc/react";
import { toast } from "@/hooks/use-toast";
import { generateUserId, validateUserId } from "@/lib/user-utils";

export default function Home() {
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
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background pt-16">
      {/* Modern animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10"></div>
        <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse rounded-full bg-secondary/20 blur-3xl delay-1000"></div>
        <div className="absolute left-1/2 top-3/4 h-64 w-64 animate-pulse rounded-full bg-accent/20 blur-3xl delay-500"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="container relative flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="space-y-6 text-center">
          <h1 className="bg-gradient-to-r from-foreground via-primary to-foreground/60 bg-clip-text text-6xl font-extrabold tracking-tight text-transparent sm:text-[6rem] lg:text-[8rem]">
            AIOCatalogs
          </h1>
          <p className="max-w-2xl text-xl text-muted-foreground">
            Choose how you want to get started with your supercharged catalog
            experience
          </p>
        </div>

        <div className="grid w-full max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2">
          <Card
            className="group h-full cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-card/70 hover:shadow-2xl"
            onClick={handleCreateNewUser}
          >
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="rounded-full border border-primary/20 bg-primary/10 p-3">
                  {isCreatingUser ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <UserPlus className="h-6 w-6 text-primary" />
                  )}
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">
                  {isCreatingUser ? "Creating User..." : "Create New User"}
                </CardTitle>
                <CardDescription className="text-base">
                  {isCreatingUser
                    ? "Generating your unique user ID..."
                    : "Generate a new unique user ID and start fresh with a new configuration"}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card
            className="group h-full cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-card/70 hover:shadow-2xl"
            onClick={handleShowExistingUserModal}
          >
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="rounded-full border border-secondary/20 bg-secondary/10 p-3">
                  <LogIn className="h-6 w-6 text-secondary-foreground" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">
                  Use Existing ID
                </CardTitle>
                <CardDescription className="text-base">
                  Already have a user ID? Enter it to access your existing
                  configuration
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Additional info section */}
        <div className="mt-12 space-y-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secure • Fast • Modern</span>
          </div>
        </div>
      </div>

      {/* Existing User Modal */}
      {showExistingUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Use Existing ID</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowExistingUserModal(false);
                  setUserId("");
                }}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="mb-6 text-muted-foreground">
              Enter your user ID to continue
            </p>
            <form onSubmit={handleExistingUserSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your user ID"
                  required
                  disabled={isCheckingUser}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowExistingUserModal(false);
                    setUserId("");
                  }}
                  className="flex-1"
                  disabled={isCheckingUser}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!userId.trim() || isCheckingUser}
                  className="flex-1"
                >
                  {isCheckingUser && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isCheckingUser ? "Checking..." : "Continue"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
