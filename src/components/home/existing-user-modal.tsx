"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";

interface ExistingUserModalProps {
  isOpen: boolean;
  userId: string;
  isCheckingUser: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onUserIdChange: (value: string) => void;
}

export function ExistingUserModal({
  isOpen,
  userId,
  isCheckingUser,
  onClose,
  onSubmit,
  onUserIdChange,
}: ExistingUserModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Use Existing ID</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="mb-6 text-muted-foreground">
          Enter your user ID to continue
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => onUserIdChange(e.target.value)}
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
              onClick={onClose}
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
  );
}
