"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Sparkles,
  Plus,
  Link2,
  ExternalLink,
  Trash2,
  Copy,
  Globe,
  Package,
  AlertTriangle,
  Heart,
  MessageCircle,
  Github,
  Star,
  Shuffle,
  Edit2,
  GripVertical,
  Info,
  Play,
  Pause,
  Loader2,
  Share2,
  Calendar,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";
import {
  AddCatalogDialog,
  AddCatalogTrigger,
} from "@/components/add-catalog-dialog";

// Type definitions for the manifest structure
interface StremioManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  resources: string[];
  types: string[];
  catalogs: Array<{
    type: string;
    id: string;
    name: string;
  }>;
  idPrefixes?: string[];
}

// Error type for proper error handling
interface ValidationError {
  message: string;
}

interface TRPCError {
  message: string;
}

interface DashboardContentProps {
  userId: string;
}

export function DashboardContent({ userId }: DashboardContentProps) {
  const [catalogUrl, setCatalogUrl] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [isAddingCatalog, setIsAddingCatalog] = useState(false);

  // Share dialog states
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedCatalogsForShare, setSelectedCatalogsForShare] = useState<
    number[]
  >([]);
  const [shareName, setShareName] = useState("");
  const [shareDescription, setShareDescription] = useState("");
  const [shareExpirationDays, setShareExpirationDays] = useState<
    number | undefined
  >(30);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [showMyShares, setShowMyShares] = useState(false);

  // Add catalog dialog state
  const [isAddCatalogDialogOpen, setIsAddCatalogDialogOpen] = useState(false);

  const dragCounter = useRef(0);

  // TRPC queries and mutations
  const {
    data: catalogs = [],
    refetch: refetchCatalogs,
    isLoading,
  } = api.catalog.list.useQuery({
    userId,
  });

  const addCatalogMutation = api.catalog.add.useMutation({
    onSuccess: () => {
      void refetchCatalogs();
      setCatalogUrl("");
      setIsAddingCatalog(false);
    },
    onError: (error: TRPCError) => {
      setIsAddingCatalog(false);

      // Extract validation error message if it's a validation error
      let errorMessage = "Failed to add catalog";
      try {
        const errorData = JSON.parse(error.message) as ValidationError[];
        if (Array.isArray(errorData) && errorData[0]?.message) {
          errorMessage = errorData[0].message;
        } else {
          errorMessage = error.message;
        }
      } catch {
        errorMessage = error.message || "Failed to add catalog";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateCatalogMutation = api.catalog.update.useMutation({
    onSuccess: () => {
      void refetchCatalogs();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update catalog",
        variant: "destructive",
      });
    },
  });

  const removeCatalogMutation = api.catalog.remove.useMutation({
    onSuccess: () => {
      void refetchCatalogs();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove catalog",
        variant: "destructive",
      });
    },
  });

  const reorderCatalogsMutation = api.catalog.reorder.useMutation({
    onSuccess: () => {
      void refetchCatalogs();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reorder catalogs",
        variant: "destructive",
      });
    },
  });

  // Share mutations
  const createShareMutation = api.share.create.useMutation({
    onSuccess: (result) => {
      setIsCreatingShare(false);
      setIsShareDialogOpen(false);
      setSelectedCatalogsForShare([]);
      setShareName("");
      setShareDescription("");

      // Copy share URL to clipboard
      void navigator.clipboard.writeText(
        typeof window !== "undefined"
          ? `${window.location.origin}/share/${result.shareId}`
          : `/share/${result.shareId}`,
      );

      toast({
        title: "Share Created Successfully",
        description: "Share URL has been copied to your clipboard.",
      });

      void refetchMyShares();
    },
    onError: (error) => {
      setIsCreatingShare(false);
      toast({
        title: "Error",
        description: error.message || "Failed to create share",
        variant: "destructive",
      });
    },
  });

  const { data: myShares = [], refetch: refetchMyShares } =
    api.share.listByUser.useQuery({
      userId,
    });

  const deleteShareMutation = api.share.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Share Deleted",
        description: "The share has been deactivated.",
      });
      void refetchMyShares();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete share",
        variant: "destructive",
      });
    },
  });

  // Helper function to transform stremio:// URLs to https://
  const transformStremioUrl = (url: string): string => {
    if (url.startsWith("stremio://")) {
      return url.replace("stremio://", "https://");
    }
    return url;
  };

  const handleAddCatalog = async () => {
    if (!catalogUrl.trim() || isAddingCatalog) return;

    // Transform stremio:// URLs to https://
    const transformedUrl = transformStremioUrl(catalogUrl.trim());

    setIsAddingCatalog(true);
    addCatalogMutation.mutate(
      {
        userId,
        manifestUrl: transformedUrl,
      },
      {
        onSuccess: () => {
          // Update the input field with the transformed URL
          setCatalogUrl(transformedUrl);
          toast({
            title: "Catalog Added",
            description:
              "The catalog has been successfully added to your collection.",
          });
        },
      },
    );
  };

  // Function to add unified catalog directly to Stremio
  const handleAddToStremio = () => {
    const manifestUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/${userId}/manifest.json`
        : `/${userId}/manifest.json`;

    const stremioUrl = `stremio://${manifestUrl.replace(/^https?:\/\//, "")}`;

    // Try to open in Stremio app
    window.open(stremioUrl, "_blank");

    toast({
      title: "Opening Stremio",
      description: "Attempting to add the unified catalog to Stremio app...",
    });
  };

  const handleRemoveCatalog = (catalogId: number) => {
    removeCatalogMutation.mutate(
      {
        catalogId,
        userId,
      },
      {
        onSuccess: () => {
          toast({
            title: "Catalog Removed",
            description: "The catalog has been removed from your collection.",
          });
        },
      },
    );
  };

  const handleRandomizeCatalogContent = (
    catalogId: number,
    catalogName: string,
  ) => {
    const catalog = catalogs.find((c) => c.id === catalogId);
    if (!catalog) return;

    const newRandomizedState = !catalog.randomized;
    updateCatalogMutation.mutate(
      {
        catalogId,
        userId,
        randomized: newRandomizedState,
      },
      {
        onSuccess: () => {
          toast({
            title: newRandomizedState
              ? "Catalog Randomized"
              : "Catalog Unrandomized",
            description: `${catalogName} content has been ${newRandomizedState ? "randomized" : "restored to original order"}.`,
          });
        },
      },
    );
  };

  const handleToggleCatalogStatus = (catalogId: number) => {
    const catalog = catalogs.find((c) => c.id === catalogId);
    if (!catalog) return;

    const newStatus = catalog.status === "active" ? "inactive" : "active";
    updateCatalogMutation.mutate(
      {
        catalogId,
        userId,
        status: newStatus,
      },
      {
        onSuccess: () => {
          toast({
            title: "Catalog Status Updated",
            description: `Catalog is now ${newStatus}.`,
          });
        },
      },
    );
  };

  const handleStartEditing = (id: number, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      updateCatalogMutation.mutate(
        {
          catalogId: editingId,
          userId,
          name: editingName.trim(),
        },
        {
          onSuccess: () => {
            toast({
              title: "Catalog Renamed",
              description: "The catalog name has been updated.",
            });
          },
        },
      );
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    dragCounter.current = 0;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
  };

  const handleDragLeave = () => {
    dragCounter.current--;
  };

  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    dragCounter.current = 0;

    if (draggedItem && draggedItem !== targetId) {
      const draggedIndex = catalogs.findIndex((c) => c.id === draggedItem);
      const targetIndex = catalogs.findIndex((c) => c.id === targetId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Create new order array
        const newOrder = [...catalogs];
        const [removed] = newOrder.splice(draggedIndex, 1);
        if (removed) {
          newOrder.splice(targetIndex, 0, removed);

          // Update order in database
          const catalogIds = newOrder.map((c) => c.id);
          reorderCatalogsMutation.mutate(
            {
              userId,
              catalogIds,
            },
            {
              onSuccess: () => {
                toast({
                  title: "Catalog Moved",
                  description: "Your catalog order has been updated.",
                });
              },
            },
          );
        }
      }
    }
    setDraggedItem(null);
  };

  const handleCopyUrl = (url: string) => {
    void navigator.clipboard.writeText(url);

    toast({
      title: "URL Copied",
      description: "The URL has been copied to your clipboard.",
    });
  };

  // Share functions
  const handleOpenShareDialog = () => {
    if (catalogs.length === 0) {
      toast({
        title: "No Catalogs Available",
        description: "You need to add at least one catalog before sharing.",
        variant: "destructive",
      });
      return;
    }
    setIsShareDialogOpen(true);
  };

  const handleCreateShare = () => {
    if (selectedCatalogsForShare.length === 0) {
      toast({
        title: "No Catalogs Selected",
        description: "Please select at least one catalog to share.",
        variant: "destructive",
      });
      return;
    }

    if (!shareName.trim()) {
      toast({
        title: "Share Name Required",
        description: "Please provide a name for your share.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingShare(true);

    createShareMutation.mutate({
      userId,
      catalogIds: selectedCatalogsForShare,
      name: shareName.trim(),
      description: shareDescription.trim() || undefined,
      expiresInDays: shareExpirationDays,
    });
  };

  const handleDeleteShare = (shareId: string) => {
    deleteShareMutation.mutate({ shareId, userId });
  };

  const handleCopyShareUrl = (shareId: string) => {
    const shareUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/share/${shareId}`
        : `/share/${shareId}`;

    void navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Share URL Copied",
      description: "The share URL has been copied to your clipboard.",
    });
  };

  const toggleCatalogSelection = (catalogId: number) => {
    setSelectedCatalogsForShare((prev) =>
      prev.includes(catalogId)
        ? prev.filter((id) => id !== catalogId)
        : [...prev, catalogId],
    );
  };

  // Handle adding catalog from the new dialog
  const handleAddCatalogFromDialog = (catalog: {
    name: string;
    manifestUrl: string;
    description: string;
  }) => {
    setIsAddingCatalog(true);
    addCatalogMutation.mutate({
      userId,
      manifestUrl: catalog.manifestUrl,
    });
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2 text-center">
        <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-3xl font-bold text-transparent">
          Welcome to your Dashboard
        </h1>
        <p className="text-muted-foreground">
          Combine all your catalogs addons into one unified catalog
        </p>
      </div>

      {/* Featured Section */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Discord Server */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:bg-card/70">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20">
                  <MessageCircle className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium">Join our Discord</h3>
                  <p className="text-xs text-muted-foreground">
                    Get support & updates
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    window.open("https://discord.gg/Ma4SnagqwE", "_blank")
                  }
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Buy Me a Coffee */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:bg-card/70">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                  <Heart className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium">Support the Project</h3>
                  <p className="text-xs text-muted-foreground">
                    Buy me a coffee ☕
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    window.open("https://buymeacoffee.com/pantel", "_blank")
                  }
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Easynews++ Addon */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:bg-card/70">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
                  <Star className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium">Easynews++ Addon</h3>
                  <p className="text-xs text-muted-foreground">
                    Highly customizable Easynews addon
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    window.open("https://en.pantelx.com", "_blank")
                  }
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Section - User Info and Add Catalog in one row */}
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-2xl font-bold text-transparent">
            Add Catalogs
          </h2>
          <p className="text-muted-foreground">
            Start adding your favorite catalogs
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* User ID Card - Smaller */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm lg:col-span-1">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">User ID</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="break-all rounded-md border bg-muted/50 p-2 font-mono text-xs">
                {userId}
              </p>
              <div className="flex items-start space-x-2 rounded-md border border-orange-500/20 bg-orange-500/10 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  <p className="font-medium">Security Warning</p>
                  <p className="mt-1">
                    Do not share your User ID – it gives full access to your
                    catalogs and API keys.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Catalog Card - Takes up more space */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm lg:col-span-3">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Add New Catalog</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {/* Quick Add Section */}
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="catalog-url"
                        type="url"
                        placeholder="https://example.com/manifest.json or stremio://..."
                        value={catalogUrl}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // Automatically transform stremio:// URLs while typing
                          const transformedValue =
                            transformStremioUrl(inputValue);
                          setCatalogUrl(transformedValue);
                        }}
                        className="border-border/50 bg-background/50 pl-10"
                      />
                    </div>
                    <Button
                      onClick={handleAddCatalog}
                      disabled={!catalogUrl.trim() || isAddingCatalog}
                      variant="outline"
                    >
                      {isAddingCatalog ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Additional Buttons Section */}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <AddCatalogTrigger
                      onClick={() => setIsAddCatalogDialogOpen(true)}
                      disabled={isAddingCatalog}
                      className="flex-1 sm:flex-none"
                    />
                    <Button disabled={true} className="flex-1 sm:flex-none">
                      <Plus className="h-4 w-4" /> RPDB Configuration (Coming
                      Soon)
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Use the &quot;Add MDBList Catalog&quot; button to browse the
                  MDBList catalog library, or quickly add a manifest URL
                  directly in the input field above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Catalog Management Section */}
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-2xl font-bold text-transparent">
            Catalog Management
          </h2>
          <p className="text-muted-foreground">Manage your addon catalogs</p>
        </div>

        <div
          className={
            catalogs.length === 0 ||
            catalogs.filter((c) => c.status === "active").length === 0
              ? "grid grid-cols-1"
              : "grid grid-cols-1 gap-6 xl:grid-cols-3"
          }
        >
          {/* Active Catalogs - Takes up 2 columns on XL screens when catalogs exist, full width when empty */}
          <div className={catalogs.length === 0 ? "" : "xl:col-span-2"}>
            <Card className="h-fit border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Your Catalogs</CardTitle>
                </div>
                <div className="ml-auto">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary"
                  >
                    {catalogs.length} Total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin opacity-50" />
                    <p className="text-lg font-medium">
                      Loading your catalogs...
                    </p>
                  </div>
                ) : catalogs.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Package className="mx-auto mb-4 h-16 w-16 opacity-50" />
                    <p className="text-lg font-medium">No catalogs added yet</p>
                    <p className="text-sm">
                      Add your first catalog above to get started
                    </p>
                  </div>
                ) : (
                  <div className="max-h-96 space-y-3 overflow-y-auto pr-2">
                    {catalogs.map((catalog) => (
                      <div
                        key={catalog.id}
                        className={`rounded-lg border border-border/50 bg-background/30 transition-all ${
                          draggedItem === catalog.id ? "opacity-50" : ""
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, catalog.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, catalog.id)}
                      >
                        {/* Mobile Layout */}
                        <div className="block md:hidden">
                          <div className="space-y-2 p-3">
                            {/* Header Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="cursor-move text-muted-foreground/50 hover:text-muted-foreground">
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                {editingId === catalog.id ? (
                                  <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) =>
                                      setEditingName(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveEdit();
                                      if (e.key === "Escape")
                                        handleCancelEdit();
                                    }}
                                    onBlur={handleSaveEdit}
                                    className="flex-1 rounded border border-border/50 bg-background px-2 py-1 text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 md:text-sm"
                                    autoFocus
                                  />
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleStartEditing(
                                        catalog.id,
                                        catalog.name,
                                      )
                                    }
                                    className="group flex items-center space-x-1 rounded px-1 py-0.5 text-sm font-medium transition-colors hover:bg-muted/50"
                                  >
                                    <span className="truncate">
                                      {catalog.name}
                                    </span>
                                    <Edit2 className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                  </button>
                                )}
                              </div>
                              <Badge
                                variant={
                                  catalog.status === "active"
                                    ? "default"
                                    : "secondary"
                                }
                                className={
                                  catalog.status === "active"
                                    ? "border-green-500/20 bg-green-500/10 text-green-500"
                                    : "border-yellow-500/20 bg-yellow-500/10 text-yellow-500"
                                }
                              >
                                {catalog.status}
                              </Badge>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-muted-foreground">
                              {catalog.description}
                            </p>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Package className="h-3 w-3 flex-shrink-0" />
                                <span>
                                  {(() => {
                                    const manifest =
                                      catalog.originalManifest as StremioManifest;
                                    return (
                                      manifest?.types?.join(" & ") ||
                                      "Movies & Series"
                                    );
                                  })()}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons Row */}
                            <div className="flex items-center justify-end space-x-2 pt-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRandomizeCatalogContent(
                                    catalog.id,
                                    catalog.name,
                                  )
                                }
                                className={`h-9 w-9 p-0 ${
                                  catalog.randomized
                                    ? "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30"
                                    : "hover:bg-muted"
                                }`}
                                title={`${catalog.randomized ? "Disable" : "Enable"} catalog randomization`}
                              >
                                <Shuffle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleToggleCatalogStatus(catalog.id)
                                }
                                className={`h-9 w-9 p-0 ${
                                  catalog.status === "active"
                                    ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                                    : "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30"
                                }`}
                                title={`${catalog.status === "active" ? "Deactivate" : "Activate"} catalog`}
                              >
                                {catalog.status === "active" ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveCatalog(catalog.id)}
                                className="h-9 w-9 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden items-center justify-between p-4 md:flex">
                          <div className="flex items-center space-x-3">
                            <div className="cursor-move text-muted-foreground/50 hover:text-muted-foreground">
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center space-x-2">
                                {editingId === catalog.id ? (
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="text"
                                      value={editingName}
                                      onChange={(e) =>
                                        setEditingName(e.target.value)
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveEdit();
                                        if (e.key === "Escape")
                                          handleCancelEdit();
                                      }}
                                      onBlur={handleSaveEdit}
                                      className="rounded border border-border/50 bg-background px-2 py-1 text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 md:text-sm"
                                      autoFocus
                                    />
                                  </div>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleStartEditing(
                                        catalog.id,
                                        catalog.name,
                                      )
                                    }
                                    className="group flex items-center space-x-1 rounded px-1 py-0.5 text-sm font-medium transition-colors hover:bg-muted/50"
                                  >
                                    <span className="truncate">
                                      {catalog.name}
                                    </span>
                                    <Edit2 className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                                  </button>
                                )}
                                <Badge
                                  variant={
                                    catalog.status === "active"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={
                                    catalog.status === "active"
                                      ? "border-green-500/20 bg-green-500/10 text-green-500"
                                      : "border-yellow-500/20 bg-yellow-500/10 text-yellow-500"
                                  }
                                >
                                  {catalog.status}
                                </Badge>
                              </div>
                              <p className="truncate text-xs text-muted-foreground">
                                {catalog.description}
                              </p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Package className="h-3 w-3" />
                                  <span>
                                    {(() => {
                                      const manifest =
                                        catalog.originalManifest as StremioManifest;
                                      return (
                                        manifest?.types?.join(" & ") ||
                                        "Movies & Series"
                                      );
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRandomizeCatalogContent(
                                  catalog.id,
                                  catalog.name,
                                )
                              }
                              className={`h-8 w-8 p-0 ${
                                catalog.randomized
                                  ? "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30"
                                  : "hover:bg-muted"
                              }`}
                              title={`${catalog.randomized ? "Disable" : "Enable"} catalog randomization`}
                            >
                              <Shuffle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleToggleCatalogStatus(catalog.id)
                              }
                              className={`h-8 w-8 p-0 ${
                                catalog.status === "active"
                                  ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                                  : "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30"
                              }`}
                              title={`${catalog.status === "active" ? "Deactivate" : "Activate"} catalog`}
                            >
                              {catalog.status === "active" ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCatalog(catalog.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Generated Manifest Info - Takes up 1 column on XL screens */}
          <div>
            {catalogs.length > 0 &&
              catalogs.filter((c) => c.status === "active").length > 0 && (
                <Card className="h-fit border-border/50 border-primary/20 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">
                        Your Unified Catalog
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Your unified manifest combining all{" "}
                      {catalogs.filter((c) => c.status === "active").length}{" "}
                      active catalogs
                    </p>

                    <div className="flex items-start space-x-2 rounded-md border border-blue-500/20 bg-blue-500/10 p-3">
                      <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        <p className="font-medium">Important Note</p>
                        <p className="mt-1">
                          You need to reinstall the addon after adding, removing
                          or renaming catalogs.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/50 bg-background/30 p-3">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-primary" />
                          <span className="break-all font-mono text-xs">
                            {typeof window !== "undefined"
                              ? `${window.location.origin}/${userId}/manifest.json`
                              : `/${userId}/manifest.json`}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleCopyUrl(
                                typeof window !== "undefined"
                                  ? `${window.location.origin}/${userId}/manifest.json`
                                  : `/${userId}/manifest.json`,
                              )
                            }
                            className="flex-1"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Manifest URL
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleAddToStremio}
                            className="flex-1"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Add to Stremio
                          </Button>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Install your unified catalog addon by adding the URL to
                      your favorite streaming app.
                    </p>
                  </CardContent>
                </Card>
              )}
          </div>
        </div>
      </div>

      {/* Share Section */}
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
                onClick={handleOpenShareDialog}
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
                onClick={() => setShowMyShares(!showMyShares)}
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
                            className={
                              share.isActive
                                ? "border-green-500/20 bg-green-500/10 text-green-500"
                                : "border-gray-500/20 bg-gray-500/10 text-gray-500"
                            }
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
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Created:{" "}
                              {new Date(share.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {share.expiresAt && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                Expires:{" "}
                                {new Date(share.expiresAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Package className="h-3 w-3" />
                            <span>
                              {(share.catalogIds as number[]).length} catalogs
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyShareUrl(share.shareId)}
                          title="Copy share URL"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteShare(share.shareId)}
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

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
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
                  onChange={(e) => setShareName(e.target.value)}
                  placeholder="My Awesome Catalog Collection"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="share-description">
                  Description (Optional)
                </Label>
                <Textarea
                  id="share-description"
                  value={shareDescription}
                  onChange={(e) => setShareDescription(e.target.value)}
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
                    setShareExpirationDays(
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
                  {catalogs.filter((c) => c.status === "active").length}{" "}
                  selected
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
                        onChange={() => toggleCatalogSelection(catalog.id)}
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
              onClick={() => setIsShareDialogOpen(false)}
              disabled={isCreatingShare}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateShare}
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

      {/* Footer */}
      <div className="mt-16 border-t border-border/50 pt-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Developed by{" "}
            <span className="font-medium text-primary">panteL</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <button
              onClick={() =>
                window.open("https://buymeacoffee.com/pantel", "_blank")
              }
              className="flex items-center space-x-2 text-muted-foreground transition-colors hover:text-yellow-500"
            >
              <Heart className="h-4 w-4" />
              <span>Buy me a coffee</span>
            </button>
            <button
              onClick={() =>
                window.open("https://github.com/panteLx/aiocatalogs", "_blank")
              }
              className="flex items-center space-x-2 text-muted-foreground transition-colors hover:text-primary"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </button>
            <button
              onClick={() =>
                window.open("https://discord.gg/Ma4SnagqwE", "_blank")
              }
              className="flex items-center space-x-2 text-muted-foreground transition-colors hover:text-indigo-500"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Discord</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Catalog Dialog */}
      <AddCatalogDialog
        isOpen={isAddCatalogDialogOpen}
        onOpenChange={setIsAddCatalogDialogOpen}
        onAddCatalog={handleAddCatalogFromDialog}
        userId={userId}
      />
    </div>
  );
}
