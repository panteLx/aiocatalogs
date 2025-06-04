"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";

interface RPDBConfigDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function RPDBConfigDialog({
  isOpen,
  onOpenChange,
  userId,
}: RPDBConfigDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);

  // API queries and mutations
  const getApiKeyQuery = api.rpdb.getApiKey.useQuery(
    { userId },
    { enabled: isOpen && !!userId },
  );

  const validateApiKeyMutation = api.rpdb.validateApiKey.useMutation();

  const saveApiKeyMutation = api.rpdb.saveApiKey.useMutation();

  // Load saved API key when dialog opens
  useEffect(() => {
    if (
      isOpen &&
      getApiKeyQuery.data?.hasApiKey &&
      getApiKeyQuery.data.apiKey
    ) {
      setApiKey(getApiKeyQuery.data.apiKey);
      setApiKeyValid(true);
    }
  }, [isOpen, getApiKeyQuery.data]);

  // Reset API key validation when it changes
  useEffect(() => {
    setApiKeyValid(null);
  }, [apiKey]);

  // Reset dialog state when it closes
  useEffect(() => {
    if (!isOpen) {
      // Don't reset apiKey to preserve user's entered key
    }
  }, [isOpen]);

  // Handle API key validation on Enter key press
  const handleApiKeyPress = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" && apiKey.trim().length > 10) {
      await handleApiKeyValidation();
    }
  };

  // Handle API key validation button click
  const handleApiKeyValidation = async () => {
    if (apiKey.trim().length > 10) {
      try {
        const result = await validateApiKeyMutation.mutateAsync({
          apiKey: apiKey.trim(),
        });
        if (result?.valid) {
          setApiKeyValid(true);

          // Save the API key to database
          try {
            await saveApiKeyMutation.mutateAsync({
              userId,
              apiKey: apiKey.trim(),
            });

            toast({
              title: "API Key Saved",
              description: "Your RPDB API key has been saved successfully.",
            });
          } catch (saveError) {
            console.error("Failed to save API key:", saveError);
            toast({
              title: "Warning",
              description:
                "API key validated but failed to save. You may need to re-enter it later.",
              variant: "destructive",
            });
          }
        } else {
          setApiKeyValid(false);
        }
      } catch (error) {
        setApiKeyValid(false);
      }
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            RPDB Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col space-y-4 overflow-hidden p-1">
          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="rpdb-api-key" className="text-sm font-medium">
              RPDB API Key <span className="text-red-500">*</span>
              {apiKeyValid === true && (
                <p className="text-xs text-green-600">✓ Valid API Key</p>
              )}
              {apiKeyValid === false && (
                <p className="text-xs text-red-600">✗ Invalid API Key</p>
              )}
            </Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="rpdb-api-key"
                  type="password"
                  placeholder="Enter your RPDB API key..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyPress={handleApiKeyPress}
                  className={`border-border/50 bg-background/50 pl-10 ${
                    apiKeyValid === false
                      ? "border-red-500/50"
                      : apiKeyValid === true
                        ? "border-green-500/50"
                        : ""
                  }`}
                  required
                />
                {validateApiKeyMutation.isPending && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
                {apiKeyValid === true && (
                  <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                )}
                {apiKeyValid === false && (
                  <AlertCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
                )}
              </div>
              <Button
                onClick={handleApiKeyValidation}
                disabled={
                  !apiKey.trim() ||
                  apiKey.trim().length <= 10 ||
                  validateApiKeyMutation.isPending
                }
                size="default"
                variant="outline"
              >
                {validateApiKeyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://www.patreon.com/rpdb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  patreon.com/rpdb
                </a>
                . or use the free{" "}
                <kbd className="rounded bg-muted px-1 py-0.5 text-xs">
                  t0-free-rpdb
                </kbd>{" "}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end">
          <div className="flex gap-2">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={saveApiKeyMutation.isPending}
            >
              {apiKeyValid === true ? "Close" : "Cancel"}
            </Button>
            <Button
              onClick={handleApiKeyValidation}
              disabled={
                !apiKey.trim() ||
                validateApiKeyMutation.isPending ||
                saveApiKeyMutation.isPending ||
                apiKeyValid === true
              }
            >
              {saveApiKeyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Key className="h-4 w-4" />
              )}
              {saveApiKeyMutation.isPending
                ? "Saving..."
                : apiKeyValid === true
                  ? "Saved"
                  : "Save Key"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export a trigger component for easy use
export function RPDBConfigTrigger({
  children,
  userId,
  ...props
}: {
  children: React.ReactNode;
  userId: string;
} & React.ComponentProps<typeof Button>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button {...props} onClick={() => setIsOpen(true)}>
        {children}
      </Button>
      <RPDBConfigDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        userId={userId}
      />
    </>
  );
}
