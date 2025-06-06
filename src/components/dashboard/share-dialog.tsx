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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Share2, CheckCircle } from "lucide-react";

interface Catalog {
  id: number;
  name: string;
  description: string;
  status: string;
}

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  catalogs: Catalog[];
  selectedCatalogsForShare: number[];
  onToggleCatalogSelection: (catalogId: number) => void;
  shareName: string;
  onShareNameChange: (name: string) => void;
  shareDescription: string;
  onShareDescriptionChange: (description: string) => void;
  shareExpirationDays: number | undefined;
  onShareExpirationDaysChange: (days: number | undefined) => void;
  isCreatingShare: boolean;
  onCreateShare: () => void;
}

export function ShareDialog({
  isOpen,
  onOpenChange,
  catalogs,
  selectedCatalogsForShare,
  onToggleCatalogSelection,
  shareName,
  onShareNameChange,
  shareDescription,
  onShareDescriptionChange,
  shareExpirationDays,
  onShareExpirationDaysChange,
  isCreatingShare,
  onCreateShare,
}: ShareDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Share Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Share Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-name">Share Name</Label>
              <Input
                id="share-name"
                value={shareName}
                onChange={(e) => onShareNameChange(e.target.value)}
                placeholder="My Awesome Catalog Collection"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-description">Description (Optional)</Label>
              <Textarea
                id="share-description"
                value={shareDescription}
                onChange={(e) => onShareDescriptionChange(e.target.value)}
                placeholder="A collection of the best movie and TV show catalogs..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-expiration">Expiration (Days)</Label>
              <Input
                id="share-expiration"
                type="number"
                value={shareExpirationDays ?? ""}
                onChange={(e) =>
                  onShareExpirationDaysChange(
                    e.target.value ? parseInt(e.target.value) : undefined,
                  )
                }
                placeholder="30"
                min="1"
                max="365"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for no expiration. Maximum 365 days.
              </p>
            </div>
          </div>

          {/* Catalog Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select Catalogs to Share</Label>
              <div className="text-sm text-muted-foreground">
                {selectedCatalogsForShare.length} of{" "}
                {catalogs.filter((c) => c.status === "active").length} selected
              </div>
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-border/50 p-4">
              {catalogs
                .filter((catalog) => catalog.status === "active")
                .map((catalog) => (
                  <div
                    key={catalog.id}
                    className="flex items-center space-x-3 rounded-md p-2 hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      id={`catalog-${catalog.id}`}
                      checked={selectedCatalogsForShare.includes(catalog.id)}
                      onChange={() => onToggleCatalogSelection(catalog.id)}
                      className="h-4 w-4 rounded border-border/50"
                    />
                    <label
                      htmlFor={`catalog-${catalog.id}`}
                      className="flex-1 cursor-pointer space-y-1"
                    >
                      <div className="font-medium">{catalog.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {catalog.description}
                      </div>
                    </label>
                  </div>
                ))}
            </div>
          </div>

          {/* Security Notice */}
          <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-3">
            <div className="flex items-start space-x-2">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
              <div className="text-xs text-blue-600 dark:text-blue-400">
                <p className="font-medium">Security & Privacy</p>
                <p className="mt-1">
                  Only catalog data is shared. Your User ID, API keys, and
                  personal information remain private.
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreatingShare}
          >
            Cancel
          </Button>
          <Button
            onClick={onCreateShare}
            disabled={
              isCreatingShare ||
              selectedCatalogsForShare.length === 0 ||
              !shareName.trim()
            }
          >
            {isCreatingShare ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Create Share
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
