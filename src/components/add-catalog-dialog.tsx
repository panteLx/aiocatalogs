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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Key,
  Package,
  Heart,
  CheckCircle,
  Loader2,
  AlertCircle,
  User,
  Hash,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/trpc/react";

// MDBList Catalog interface
interface MDBListCatalog {
  id: number;
  name: string;
  description: string;
  manifestUrl: string;
  types: string[];
  likes: number;
  source: string;
  listType?: "toplist" | "userlist";
  username?: string;
  listSlug?: string;
  items: number;
}

interface AddCatalogDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCatalog: (catalog: {
    name: string;
    manifestUrl: string;
    description: string;
  }) => void;
  userId: string;
}

export function AddCatalogDialog({
  isOpen,
  onOpenChange,
  userId,
}: AddCatalogDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [selectedCatalogs, setSelectedCatalogs] = useState<MDBListCatalog[]>(
    [],
  );
  const [selectedSearchResults, setSelectedSearchResults] = useState<
    MDBListCatalog[]
  >([]);
  const [isAdding, setIsAdding] = useState(false);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"browse" | "search">("browse");
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [searchName, setSearchName] = useState("");
  const [actualSearchQuery, setActualSearchQuery] = useState("");
  const [topListsLoaded, setTopListsLoaded] = useState(false);
  const [searchValidated, setSearchValidated] = useState(false);

  // API queries
  const validateApiKeyMutation = api.mdblist.validateApiKey.useQuery(
    { apiKey },
    { enabled: false, retry: false },
  );
  const getTopListsQuery = api.mdblist.getTopLists.useQuery(
    { apiKey, limit: 20 },
    { enabled: false, retry: false },
  );
  const searchListsQuery = api.mdblist.searchLists.useQuery(
    { apiKey, query: actualSearchQuery || "", limit: 20 },
    { enabled: false, retry: false },
  );
  const getApiKeyQuery = api.mdblist.getApiKey.useQuery(
    { userId },
    { enabled: isOpen && !!userId },
  );

  // Add catalog mutation
  const addCatalogMutation = api.catalog.add.useMutation();

  // Save API key mutation
  const saveApiKeyMutation = api.mdblist.saveApiKey.useMutation();

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Helper functions for multi-selection
  const toggleCatalogSelection = (catalog: MDBListCatalog) => {
    if (activeTab === "browse") {
      setSelectedCatalogs((prev) => {
        const exists = prev.find((c) => c.id === catalog.id);
        if (exists) {
          return prev.filter((c) => c.id !== catalog.id);
        } else {
          return [...prev, catalog];
        }
      });
    } else {
      setSelectedSearchResults((prev) => {
        const exists = prev.find((c) => c.id === catalog.id);
        if (exists) {
          return prev.filter((c) => c.id !== catalog.id);
        } else {
          return [...prev, catalog];
        }
      });
    }
  };

  const isCatalogSelected = (catalog: MDBListCatalog) => {
    if (activeTab === "browse") {
      return selectedCatalogs.some((c) => c.id === catalog.id);
    } else {
      return selectedSearchResults.some((c) => c.id === catalog.id);
    }
  };

  const getSelectedCatalogs = () => {
    return activeTab === "browse" ? selectedCatalogs : selectedSearchResults;
  };

  const clearSelections = () => {
    setSelectedCatalogs([]);
    setSelectedSearchResults([]);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Ctrl+A or Cmd+A to select all visible catalogs
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        if (
          activeTab === "browse" &&
          getTopListsQuery.data?.catalogs &&
          apiKeyValid === true
        ) {
          const filtered = getTopListsQuery.data.catalogs.filter(
            (catalog) =>
              searchQuery.trim() === "" ||
              catalog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              catalog.description
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              catalog.types.some((type) =>
                type.toLowerCase().includes(searchQuery.toLowerCase()),
              ),
          );
          setSelectedCatalogs([...filtered]);
        } else if (activeTab === "search" && searchListsQuery.data?.catalogs) {
          setSelectedSearchResults([...searchListsQuery.data.catalogs]);
        }
      }

      // Escape to clear selections
      if (
        e.key === "Escape" &&
        (selectedCatalogs.length > 0 || selectedSearchResults.length > 0)
      ) {
        e.preventDefault();
        clearSelections();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    activeTab,
    selectedCatalogs.length,
    selectedSearchResults.length,
    apiKeyValid,
    searchQuery,
    getTopListsQuery.data?.catalogs,
    searchListsQuery.data?.catalogs,
  ]);

  // Handle API key validation on Enter key press
  const handleApiKeyPress = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" && apiKey.trim().length > 10) {
      try {
        const result = await validateApiKeyMutation.refetch();
        if (result.data?.valid) {
          setApiKeyValid(true);

          // Save the API key to database
          try {
            const saveResult = await saveApiKeyMutation.mutateAsync({
              userId,
              apiKey: apiKey.trim(),
            });

            let toastMessage =
              "Your MDBList API key has been saved successfully.";

            if (saveResult.updatedManifestUrls > 0) {
              toastMessage += ` Updated ${saveResult.updatedManifestUrls} existing catalog(s) with the new API key.`;
            }

            toast({
              title: "API Key Saved",
              description: toastMessage,
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

          // Load toplists after successful validation
          if (!topListsLoaded) {
            await getTopListsQuery.refetch();
            setTopListsLoaded(true);
          }
        } else {
          setApiKeyValid(false);
          setTopListsLoaded(false);
        }
      } catch (error) {
        setApiKeyValid(false);
        setTopListsLoaded(false);
      }
    }
  };

  // Handle API key validation button click
  const handleApiKeyValidation = async () => {
    if (apiKey.trim().length > 10) {
      try {
        const result = await validateApiKeyMutation.refetch();
        if (result.data?.valid) {
          setApiKeyValid(true);

          // Save the API key to database
          try {
            const saveResult = await saveApiKeyMutation.mutateAsync({
              userId,
              apiKey: apiKey.trim(),
            });

            let toastMessage =
              "Your MDBList API key has been saved successfully.";

            if (saveResult.updatedManifestUrls > 0) {
              toastMessage += ` Updated ${saveResult.updatedManifestUrls} existing catalog(s) with the new API key.`;
            }

            toast({
              title: "API Key Saved",
              description: toastMessage,
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

          // Load toplists after successful validation
          if (!topListsLoaded) {
            await getTopListsQuery.refetch();
            setTopListsLoaded(true);
          }
        } else {
          setApiKeyValid(false);
          setTopListsLoaded(false);
        }
      } catch (error) {
        setApiKeyValid(false);
        setTopListsLoaded(false);
      }
    }
  };

  // Shared search logic
  const performSearch = async () => {
    if (searchName.trim()) {
      const queryToSearch = searchName.trim();

      // Validate API key once for search if not already validated for search
      if (!searchValidated && apiKey.trim().length > 10) {
        try {
          const result = await validateApiKeyMutation.refetch();
          if (result.data?.valid) {
            setApiKeyValid(true);
            setSearchValidated(true);
            setActualSearchQuery(queryToSearch);
          } else {
            setApiKeyValid(false);
            return;
          }
        } catch (error) {
          setApiKeyValid(false);
          return;
        }
      } else if (apiKeyValid === true) {
        // API key already validated for search, just perform search
        setActualSearchQuery(queryToSearch);
      }
    }
  };

  // Trigger search when actualSearchQuery changes
  useEffect(() => {
    if (actualSearchQuery && apiKeyValid === true) {
      void searchListsQuery.refetch();
    }
  }, [actualSearchQuery, apiKeyValid, searchListsQuery]);

  // Handle search on Enter key press
  const handleSearchKeyPress = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" && searchName.trim()) {
      await performSearch();
    }
  };

  // Handle search button click
  const handleSearchClick = async () => {
    await performSearch();
  };

  // Reset states when API key changes
  useEffect(() => {
    setApiKeyValid(null);
    setTopListsLoaded(false);
    setSearchValidated(false);
    setActualSearchQuery("");
  }, [apiKey]);

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

  // Reset dialog state when it closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      clearSelections();
      setIsAdding(false);
      setCurrentlyProcessing(null);
      setActiveTab("browse");
      setSearchName("");
      setActualSearchQuery("");
      setTopListsLoaded(false);
      setSearchValidated(false);
      // Don't reset apiKey and apiKeyValid to preserve user's entered key
    }
  }, [isOpen]);

  // Filter browse catalogs based on search query
  const filteredBrowseCatalogs =
    getTopListsQuery.data?.catalogs?.filter(
      (catalog) =>
        searchQuery.trim() === "" ||
        catalog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        catalog.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        catalog.types.some((type) =>
          type.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    ) ?? [];

  // Filter search results
  const filteredSearchResults = searchListsQuery.data?.catalogs ?? [];

  const handleAddCatalog = async () => {
    // Check if API key is valid
    if (!apiKey.trim() || apiKeyValid !== true) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid MDBList API key.",
        variant: "destructive",
      });
      return;
    }

    const catalogsToAdd = getSelectedCatalogs();

    if (catalogsToAdd.length === 0) {
      toast({
        title: "No Catalogs Selected",
        description: "Please select at least one catalog to add.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    setCurrentlyProcessing(null);

    try {
      // Add catalogs sequentially to avoid overwhelming the server
      let successCount = 0;
      const failedCatalogs: string[] = [];

      for (const catalog of catalogsToAdd) {
        setCurrentlyProcessing(catalog.name);
        try {
          await addCatalogMutation.mutateAsync({
            userId,
            manifestUrl: catalog.manifestUrl,
          });
          successCount++;
        } catch (error) {
          failedCatalogs.push(catalog.name);
          console.error(`Failed to add catalog ${catalog.name}:`, error);
        }
      }

      setCurrentlyProcessing(null);

      // Invalidate the catalog list query to refresh the UI
      await utils.catalog.list.invalidate({ userId });

      // Show appropriate success/error messages
      if (successCount === catalogsToAdd.length) {
        toast({
          title: "Catalogs Added Successfully",
          description: `${successCount} catalog${successCount !== 1 ? "s" : ""} added to your collection.`,
        });
      } else if (successCount > 0) {
        toast({
          title: "Partially Successful",
          description: `${successCount} of ${catalogsToAdd.length} catalogs added successfully. ${failedCatalogs.length} failed: ${failedCatalogs.join(", ")}.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to Add Catalogs",
          description: `All ${catalogsToAdd.length} catalogs failed to add. Please try again.`,
          variant: "destructive",
        });
      }

      // Reset form and close dialog if at least one succeeded
      if (successCount > 0) {
        handleClose();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to add catalogs. Please try again.";
      toast({
        title: "Error Adding Catalogs",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
      setCurrentlyProcessing(null);
    }
  };

  const handleClose = () => {
    clearSelections();
    setSearchQuery("");
    setSearchName("");
    setActualSearchQuery("");
    setApiKeyValid(null);
    setCurrentlyProcessing(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[80vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-primary" />
            <span>Add MDBList Catalogs</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Browse or search for MDBList catalogs. You can select multiple
            catalogs to add them all at once.
            <br />
            <span className="text-xs">
              <kbd className="rounded bg-muted px-1 py-0.5 text-xs">Ctrl+A</kbd>{" "}
              to select all,
              <kbd className="ml-1 rounded bg-muted px-1 py-0.5 text-xs">
                Esc
              </kbd>{" "}
              to clear selections
            </span>
          </p>
        </DialogHeader>

        <div className="flex flex-1 flex-col space-y-4 overflow-hidden p-1">
          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-sm font-medium">
              MDBList API Key <span className="text-red-500">*</span>
            </Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter your MDBList API key..."
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
                {validateApiKeyMutation.isFetching && (
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
                  apiKey.trim().length <= 10 ||
                  validateApiKeyMutation.isFetching
                }
                size="default"
                variant="outline"
              >
                {validateApiKeyMutation.isFetching ? (
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
                  href="https://mdblist.com/preferences/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  mdblist.com/preferences
                </a>
              </p>
              {apiKeyValid === true && (
                <p className="text-xs text-green-600">✓ Valid API key</p>
              )}
              {apiKeyValid === false && (
                <p className="text-xs text-red-600">✗ Invalid API key</p>
              )}
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex space-x-1 rounded-lg border border-border/50 bg-muted/30 p-1">
            <Button
              variant={activeTab === "browse" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("browse")}
              className="relative flex-1"
            >
              <Package className="h-4 w-4" />
              Browse Catalogs
              {activeTab === "browse" && selectedCatalogs.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs font-medium">
                  {selectedCatalogs.length}
                </span>
              )}
            </Button>
            <Button
              variant={activeTab === "search" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("search")}
              className="relative flex-1"
            >
              <Search className="h-4 w-4" />
              Search Catalogs
              {activeTab === "search" && selectedSearchResults.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs font-medium">
                  {selectedSearchResults.length}
                </span>
              )}
            </Button>
          </div>

          {activeTab === "browse" ? (
            <div className="flex flex-1 flex-col space-y-4 overflow-hidden p-1">
              {/* Search Input */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search toplists by name, description, or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-border/50 bg-background/50 pl-10"
                    disabled={apiKeyValid !== true}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {searchQuery.trim() && (
                      <span>
                        Found {filteredBrowseCatalogs.length} catalog
                        {filteredBrowseCatalogs.length !== 1 ? "s" : ""}
                        {searchQuery.trim() && ` matching "${searchQuery}"`}
                      </span>
                    )}
                  </div>
                  {filteredBrowseCatalogs.length > 0 &&
                    apiKeyValid === true && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setSelectedCatalogs([...filteredBrowseCatalogs])
                          }
                          disabled={
                            selectedCatalogs.length ===
                            filteredBrowseCatalogs.length
                          }
                        >
                          Select All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCatalogs([])}
                          disabled={selectedCatalogs.length === 0}
                        >
                          Clear All
                        </Button>
                      </div>
                    )}
                </div>
              </div>

              {/* Catalog Grid */}
              <div className="flex-1 overflow-y-auto p-1">
                {apiKeyValid !== true ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Key className="mx-auto mb-4 h-16 w-16 opacity-50" />
                    <p className="text-lg font-medium">API Key Required</p>
                    <p className="text-sm">
                      Please enter a valid MDBList API key to browse catalogs
                    </p>
                  </div>
                ) : getTopListsQuery.isLoading ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin opacity-50" />
                    <p className="text-lg font-medium">Loading Catalogs</p>
                    <p className="text-sm">Fetching MDBList toplists...</p>
                  </div>
                ) : getTopListsQuery.error ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <AlertCircle className="mx-auto mb-4 h-16 w-16 opacity-50" />
                    <p className="text-lg font-medium">
                      Error Loading Catalogs
                    </p>
                    <p className="text-sm">{getTopListsQuery.error.message}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {filteredBrowseCatalogs.map((catalog) => (
                      <Card
                        key={catalog.id}
                        className={`cursor-pointer border-border/50 bg-background/30 transition-all duration-200 hover:bg-background/50 ${
                          isCatalogSelected(catalog)
                            ? "border-primary/50 ring-2 ring-primary"
                            : ""
                        }`}
                        onClick={() => toggleCatalogSelection(catalog)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="flex items-center space-x-2 text-sm font-medium">
                                <span className="truncate">{catalog.name}</span>
                              </CardTitle>
                            </div>
                            {isCatalogSelected(catalog) && (
                              <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary" />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {catalog.description.length > 0
                              ? catalog.description
                              : "No description available"}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {catalog.username || "Unknown User"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Hash className="h-3 w-3 flex-shrink-0" />
                              <span>
                                {catalog.items.toLocaleString()} items
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Heart className="h-3 w-3 flex-shrink-0" />
                              <span>{catalog.likes}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {catalog.types.map((type) => (
                              <Badge
                                key={type}
                                variant="secondary"
                                className="text-xs capitalize"
                              >
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {filteredBrowseCatalogs.length === 0 &&
                  apiKeyValid === true &&
                  !getTopListsQuery.isLoading && (
                    <div className="py-12 text-center text-muted-foreground">
                      <Package className="mx-auto mb-4 h-16 w-16 opacity-50" />
                      <p className="text-lg font-medium">No catalogs found</p>
                      <p className="text-sm">
                        Try adjusting your search terms or check your connection
                      </p>
                    </div>
                  )}
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-4 overflow-y-auto p-1">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Search MDBList Catalogs
                  </Label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search for catalogs..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        onKeyPress={handleSearchKeyPress}
                        className="border-border/50 bg-background/50 pl-10"
                        disabled={apiKeyValid !== true}
                      />
                    </div>
                    <Button
                      onClick={handleSearchClick}
                      disabled={apiKeyValid !== true || !searchName.trim()}
                      size="default"
                      variant="outline"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  {actualSearchQuery && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Found {filteredSearchResults.length} catalog
                        {filteredSearchResults.length !== 1 ? "s" : ""}
                        {actualSearchQuery &&
                          ` matching "${actualSearchQuery}"`}
                      </p>
                      {filteredSearchResults.length > 0 && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setSelectedSearchResults([
                                ...filteredSearchResults,
                              ])
                            }
                            disabled={
                              selectedSearchResults.length ===
                              filteredSearchResults.length
                            }
                          >
                            Select All
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSearchResults([])}
                            disabled={selectedSearchResults.length === 0}
                          >
                            Clear All
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Search Results Grid */}
                <div className="flex-1 overflow-y-auto p-1">
                  {apiKeyValid !== true ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <Key className="mx-auto mb-4 h-16 w-16 opacity-50" />
                      <p className="text-lg font-medium">API Key Required</p>
                      <p className="text-sm">
                        Please enter a valid MDBList API key to search catalogs
                      </p>
                    </div>
                  ) : !actualSearchQuery ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <Search className="mx-auto mb-4 h-16 w-16 opacity-50" />
                      <p className="text-lg font-medium">Ready to Search</p>
                      <p className="text-sm">
                        Enter a search term and press Enter or click the search
                        button
                      </p>
                    </div>
                  ) : searchListsQuery.isLoading ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin opacity-50" />
                      <p className="text-lg font-medium">Searching</p>
                      <p className="text-sm">Looking for catalogs...</p>
                    </div>
                  ) : searchListsQuery.error ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <AlertCircle className="mx-auto mb-4 h-16 w-16 opacity-50" />
                      <p className="text-lg font-medium">Search Error</p>
                      <p className="text-sm">
                        {searchListsQuery.error.message}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {filteredSearchResults.map((result) => (
                        <Card
                          key={result.id}
                          className={`cursor-pointer border-border/50 bg-background/30 transition-all duration-200 hover:bg-background/50 ${
                            isCatalogSelected(result)
                              ? "border-primary/50 ring-2 ring-primary"
                              : ""
                          }`}
                          onClick={() => toggleCatalogSelection(result)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <CardTitle className="flex items-center space-x-2 text-sm font-medium">
                                  <span className="truncate">
                                    {result.name}
                                  </span>
                                </CardTitle>
                              </div>
                              {isCatalogSelected(result) && (
                                <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary" />
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-0">
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {result.description.length > 0
                                ? result.description
                                : "No description available"}
                            </p>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {result.username || "Unknown User"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Hash className="h-3 w-3 flex-shrink-0" />
                                <span>
                                  {result.items.toLocaleString()} items
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Heart className="h-3 w-3 flex-shrink-0" />
                                <span>{result.likes}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {result.types.map((type) => (
                                <Badge
                                  key={type}
                                  variant="secondary"
                                  className="text-xs capitalize"
                                >
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {filteredSearchResults.length === 0 &&
                    actualSearchQuery &&
                    !searchListsQuery.isLoading &&
                    apiKeyValid === true && (
                      <div className="py-12 text-center text-muted-foreground">
                        <Search className="mx-auto mb-4 h-16 w-16 opacity-50" />
                        <p className="text-lg font-medium">No catalogs found</p>
                        <p className="text-sm">
                          Try different search terms or browse the main catalog
                        </p>
                      </div>
                    )}
                </div>

                <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-3">
                  <div className="flex items-start space-x-2">
                    <Search className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      <p className="font-medium">MDBList Catalog Search</p>
                      <p className="mt-1">
                        Search through MDBList toplists and user lists to find
                        additional content. You can select multiple catalogs and
                        add them all at once.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {currentlyProcessing ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Processing: {currentlyProcessing}</span>
                </span>
              ) : getSelectedCatalogs().length > 0 ? (
                <span>
                  {getSelectedCatalogs().length} catalog
                  {getSelectedCatalogs().length !== 1 ? "s" : ""} selected
                </span>
              ) : null}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCatalog}
                disabled={
                  isAdding ||
                  apiKeyValid !== true ||
                  getSelectedCatalogs().length === 0
                }
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add{" "}
                    {getSelectedCatalogs().length > 0
                      ? `${getSelectedCatalogs().length} `
                      : ""}
                    Catalog{getSelectedCatalogs().length !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export trigger button component
interface AddCatalogTriggerProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function AddCatalogTrigger({
  onClick,
  disabled = false,
  className = "",
}: AddCatalogTriggerProps) {
  return (
    <Button onClick={onClick} disabled={disabled} className={`${className}`}>
      <Plus className="h-4 w-4" />
      Add MDBList Catalog
    </Button>
  );
}
