"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ExternalLink, Link2, Plus, Share2, Trash2 } from "lucide-react";

interface ShareSectionProps {
  userId: string;
  catalogs: Array<{
    id: number;
    name: string;
    status: string;
  }>;
  isLoading: boolean;
  myShares: Array<{
    id: number;
    shareId: string;
    sharedByUserId: string;
    catalogIds: unknown;
    name: string;
    description: string;
    isActive: boolean;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  showMyShares: boolean;
  onOpenShareDialog: () => void;
  onSetShowMyShares: (show: boolean) => void;
  onCopyShareUrl: (shareId: string) => void;
  onDeleteShare: (shareId: string) => void;
}

export function ShareSection({
  userId: _userId,
  catalogs,
  isLoading,
  myShares,
  showMyShares,
  onOpenShareDialog,
  onSetShowMyShares,
  onCopyShareUrl,
  onDeleteShare,
}: ShareSectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-2xl font-bold text-transparent">
          Share Your Catalogs
        </h2>
        <p className="text-muted-foreground">
          Share selected catalogs with others while keeping your data secure
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Create Share Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-primary" />
              <CardTitle>Create New Share</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a secure share link for selected catalogs. Recipients can
              import catalogs without seeing your personal information.
            </p>
            <Button
              onClick={onOpenShareDialog}
              className="w-full"
              disabled={
                catalogs.length === 0 ||
                isLoading ||
                catalogs.filter((c) => c.status === "active").length === 0
              }
            >
              <Link2 className="h-4 w-4" />
              Create Share Link
            </Button>
          </CardContent>
        </Card>

        {/* My Shares Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Share2 className="h-5 w-5 text-primary" />
                <CardTitle>My Shares</CardTitle>
              </div>
              <Badge variant="secondary">{myShares.length} Total</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Manage your active shares and view sharing statistics.
            </p>
            <Button
              variant="outline"
              onClick={() => onSetShowMyShares(!showMyShares)}
              className="w-full"
            >
              {showMyShares ? "Hide" : "View"} My Shares
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* My Shares List */}
      {showMyShares && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Share2 className="h-5 w-5 text-primary" />
              <CardTitle>My Shares</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {myShares.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Share2 className="mx-auto mb-4 h-16 w-16 opacity-50" />
                <p className="text-lg font-medium">No shares added yet</p>
                <p className="text-sm">
                  Add your first share above to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myShares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-background/30 p-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{share.name}</h4>
                        <Badge
                          variant={share.isActive ? "default" : "secondary"}
                        >
                          {share.isActive ? "active" : "inactive"}
                        </Badge>
                      </div>
                      {share.description && (
                        <p className="text-sm text-muted-foreground">
                          {share.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>
                          {Array.isArray(share.catalogIds)
                            ? share.catalogIds.length
                            : (share.catalogIds as number[]).length}{" "}
                          catalogs
                        </span>
                        <span>•</span>
                        <span>
                          Created{" "}
                          {new Date(share.createdAt).toLocaleDateString()}
                        </span>
                        {share.expiresAt && (
                          <>
                            <span>•</span>
                            <span>
                              Expires{" "}
                              {new Date(share.expiresAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onCopyShareUrl(share.shareId)}
                        title="Copy share URL"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          window.open(`/share/${share.shareId}`, "_blank")
                        }
                        title="Open share page"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteShare(share.shareId)}
                        className="text-destructive hover:text-destructive"
                        title="Delete share"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
