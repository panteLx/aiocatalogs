"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UserPlus, LogIn, ArrowRight, Loader2 } from "lucide-react";

interface UserActionCardsProps {
  isCreatingUser: boolean;
  onCreateNewUser: (e: React.MouseEvent) => void;
  onShowExistingUserModal: (e: React.MouseEvent) => void;
}

export function UserActionCards({
  isCreatingUser,
  onCreateNewUser,
  onShowExistingUserModal,
}: UserActionCardsProps) {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2">
      <Card
        className="group h-full cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-card/70 hover:shadow-2xl"
        onClick={onCreateNewUser}
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
        onClick={onShowExistingUserModal}
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
  );
}
