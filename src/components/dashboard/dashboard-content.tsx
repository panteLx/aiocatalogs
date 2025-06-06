"use client";

import { useState, useRef } from "react";
import { toast } from "@/hooks/ui/use-toast";
import { api } from "@/trpc/react";
import { AddCatalogDialog } from "@/components/forms/add-catalog-dialog";
import { isMDBListCatalogClient } from "@/lib/utils/mdblist-client-utils";

// Import our new components
import { DashboardHeader } from "./dashboard-header";
import { FeaturedCards } from "./featured-cards";
import { UserInfoCard } from "./user-info-card";
import { AddCatalogSection } from "./add-catalog-section";
import { SectionHeader } from "./section-header";
import { CatalogList } from "./catalog-list";
import { UnifiedManifestCard } from "./unified-manifest-card";
import { ShareSection } from "./share-section";
import { ShareDialog } from "./share-dialog";
import { useUser } from "@clerk/nextjs";

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
  // Get the current user and loading state inside the component
  const { user, isLoaded } = useUser();
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

  // Bulk RPDB toggle loading state
  const [isTogglingRpdbForAll, setIsTogglingRpdbForAll] = useState(false);

  const dragCounter = useRef(0);

  // TRPC queries and mutations
  const {
    data: catalogs = [],
    refetch: refetchCatalogs,
    isLoading,
  } = api.catalog.list.useQuery({
    userId,
  });

  // Check if user has RPDB API key configured
  const { data: rpdbApiKeyData, refetch: refetchRpdbApiKey } =
    api.rpdb.getApiKey.useQuery({
      userId,
    });

  const hasRpdbApiKey = rpdbApiKeyData?.hasApiKey ?? false;

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

  const handleToggleRpdbEnabled = (catalogId: number, catalogName: string) => {
    const catalog = catalogs.find((c) => c.id === catalogId);
    if (!catalog) return;

    // Check if the catalog is from MDBList before allowing RPDB toggle
    if (!isMDBListCatalogClient(catalog.manifestUrl)) {
      toast({
        title: "RPDB Not Available",
        description:
          "RPDB poster enhancement is only available for MDBList catalogs.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has RPDB API key configured
    if (!hasRpdbApiKey) {
      toast({
        title: "RPDB API Key Required",
        description:
          "Please configure your RPDB API key first to enable RPDB functionality.",
        variant: "destructive",
      });
      return;
    }

    const newRpdbState = !catalog.rpdbEnabled;
    updateCatalogMutation.mutate(
      {
        catalogId,
        userId,
        rpdbEnabled: newRpdbState,
      },
      {
        onSuccess: () => {
          toast({
            title: newRpdbState
              ? "RPDB Poster Enhancement Enabled"
              : "RPDB Poster Enhancement Disabled",
            description: `${catalogName} will ${newRpdbState ? "now use enhanced posters from RPDB" : "use original posters"}.`,
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

  const handleToggleRpdbForAll = async () => {
    // Check if user has RPDB API key configured
    if (!hasRpdbApiKey) {
      toast({
        title: "RPDB API Key Required",
        description:
          "Please configure your RPDB API key first to enable RPDB functionality.",
        variant: "destructive",
      });
      return;
    }

    if (catalogs.length === 0) {
      toast({
        title: "No Catalogs Available",
        description: "Add some catalogs first to toggle RPDB for them.",
        variant: "destructive",
      });
      return;
    }

    // Filter only MDBList catalogs for RPDB operations
    const mdblistCatalogs = catalogs.filter((c) =>
      isMDBListCatalogClient(c.manifestUrl),
    );

    if (mdblistCatalogs.length === 0) {
      toast({
        title: "No MDBList Catalogs Available",
        description:
          "RPDB enhancement is only available for MDBList catalogs. Add some MDBList catalogs first.",
        variant: "destructive",
      });
      return;
    }

    // Check if already processing
    if (isTogglingRpdbForAll) {
      return;
    }

    // Set loading state
    setIsTogglingRpdbForAll(true);

    // Check if majority of MDBList catalogs have RPDB enabled to determine toggle direction
    const enabledCount = mdblistCatalogs.filter((c) => c.rpdbEnabled).length;
    const shouldEnable = enabledCount < mdblistCatalogs.length / 2;

    const catalogsToUpdate = mdblistCatalogs.filter(
      (c) => c.rpdbEnabled !== shouldEnable,
    );

    if (catalogsToUpdate.length === 0) {
      setIsTogglingRpdbForAll(false);
      toast({
        title: "No Changes Needed",
        description: `RPDB is already ${shouldEnable ? "enabled" : "disabled"} for all MDBList catalogs.`,
      });
      return;
    }

    // Update catalogs sequentially to avoid overwhelming the database
    const updateCatalogSequentially = async (index: number): Promise<void> => {
      if (index >= catalogsToUpdate.length) {
        setIsTogglingRpdbForAll(false);
        toast({
          title: `RPDB ${shouldEnable ? "Enabled" : "Disabled"} for All MDBList Catalogs`,
          description: `RPDB poster enhancement has been ${shouldEnable ? "enabled" : "disabled"} for ${catalogsToUpdate.length} MDBList catalog${catalogsToUpdate.length > 1 ? "s" : ""}.`,
        });
        return;
      }

      const catalog = catalogsToUpdate[index];
      if (!catalog) return;

      return new Promise<void>((resolve, reject) => {
        updateCatalogMutation.mutate(
          {
            catalogId: catalog.id,
            userId,
            rpdbEnabled: shouldEnable,
          },
          {
            onSuccess: () => {
              // Wait a bit before updating the next catalog, then continue sequentially
              setTimeout(() => {
                updateCatalogSequentially(index + 1)
                  .then(() => resolve())
                  .catch(reject);
              }, 100);
            },
            onError: (error) => {
              setIsTogglingRpdbForAll(false);
              toast({
                title: "Error",
                description: `Failed to update ${catalog.name}: ${error.message}`,
                variant: "destructive",
              });
              reject(error);
            },
          },
        );
      });
    };

    try {
      await updateCatalogSequentially(0);
    } catch (error) {
      console.error("Error updating catalogs:", error);
      setIsTogglingRpdbForAll(false);
    }
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
      <DashboardHeader
        title={`Welcome to your Dashboard${isLoaded && user?.firstName ? `, ${user.firstName}` : ""}!`}
        description="Combine all your catalogs addons into one unified catalog"
      />

      {/* Featured Section */}
      <FeaturedCards />

      {/* Add Catalogs Section */}
      <div className="space-y-6">
        <SectionHeader
          title="Add Catalogs"
          description="Start adding your favorite catalogs"
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <UserInfoCard userId={userId} />
          <AddCatalogSection
            catalogUrl={catalogUrl}
            setCatalogUrl={setCatalogUrl}
            isAddingCatalog={isAddingCatalog}
            onAddCatalog={handleAddCatalog}
            onOpenAddDialog={() => setIsAddCatalogDialogOpen(true)}
            userId={userId}
            onRpdbConfigured={() => void refetchRpdbApiKey()}
            transformStremioUrl={transformStremioUrl}
          />
        </div>
      </div>

      {/* Catalog Management Section */}
      <div className="space-y-6">
        <SectionHeader
          title="Catalog Management"
          description="Manage your addon catalogs"
        />

        <div
          className={
            catalogs.length === 0 ||
            catalogs.filter((c) => c.status === "active").length === 0
              ? "grid grid-cols-1"
              : "grid grid-cols-1 gap-6 xl:grid-cols-3"
          }
        >
          <div className={catalogs.length === 0 ? "" : "xl:col-span-2"}>
            <CatalogList
              catalogs={catalogs}
              isLoading={isLoading}
              editingId={editingId}
              editingName={editingName}
              draggedItem={draggedItem}
              hasRpdbApiKey={hasRpdbApiKey}
              isTogglingRpdbForAll={isTogglingRpdbForAll}
              onToggleRpdbForAll={handleToggleRpdbForAll}
              onStartEditing={handleStartEditing}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onRandomizeCatalogContent={handleRandomizeCatalogContent}
              onToggleRpdbEnabled={handleToggleRpdbEnabled}
              onToggleCatalogStatus={handleToggleCatalogStatus}
              onRemoveCatalog={handleRemoveCatalog}
              setEditingName={setEditingName}
            />
          </div>
          <div>
            {catalogs.length > 0 &&
              catalogs.filter((c) => c.status === "active").length > 0 && (
                <UnifiedManifestCard
                  catalogsCount={catalogs.length}
                  userId={userId}
                  activeCatalogsCount={
                    catalogs.filter((c) => c.status === "active").length
                  }
                  onCopyUrl={handleCopyUrl}
                  onAddToStremio={handleAddToStremio}
                />
              )}
          </div>
        </div>
      </div>

      {/* Share Section */}
      <ShareSection
        userId={userId}
        catalogs={catalogs}
        isLoading={isLoading}
        myShares={myShares}
        showMyShares={showMyShares}
        onOpenShareDialog={handleOpenShareDialog}
        onSetShowMyShares={setShowMyShares}
        onCopyShareUrl={handleCopyShareUrl}
        onDeleteShare={handleDeleteShare}
      />

      {/* Share Dialog */}
      <ShareDialog
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        catalogs={catalogs}
        selectedCatalogsForShare={selectedCatalogsForShare}
        shareName={shareName}
        shareDescription={shareDescription}
        shareExpirationDays={shareExpirationDays}
        isCreatingShare={isCreatingShare}
        onToggleCatalogSelection={toggleCatalogSelection}
        onShareNameChange={setShareName}
        onShareDescriptionChange={setShareDescription}
        onShareExpirationDaysChange={setShareExpirationDays}
        onCreateShare={handleCreateShare}
      />

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
