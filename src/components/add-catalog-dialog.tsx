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
  Star,
  Download,
  CheckCircle,
  Loader2,
  AlertCircle,
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
  rating: number;
  downloads: string;
  source: string;
  listType?: "toplist" | "userlist";
  username?: string;
  listSlug?: string;
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
  onAddCatalog,
  userId,
}: AddCatalogDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [selectedCatalog, setSelectedCatalog] = useState<MDBListCatalog | null>(
    null,
  );
  const [selectedSearchResult, setSelectedSearchResult] =
    useState<MDBListCatalog | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "search">("browse");
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [searchName, setSearchName] = useState("");
  const [actualSearchQuery, setActualSearchQuery] = useState("");

  // API queries
  const validateApiKeyMutation = api.mdblist.validateApiKey.useQuery(
    { apiKey },
    { enabled: false, retry: false },
  );
  const getTopListsQuery = api.mdblist.getTopLists.useQuery(
    { apiKey, limit: 20 },
    { enabled: !!apiKey && apiKeyValid === true },
  );
  const searchListsQuery = api.mdblist.searchLists.useQuery(
    { apiKey, query: actualSearchQuery, limit: 20 },
    { enabled: !!apiKey && apiKeyValid === true && !!actualSearchQuery.trim() },
  );

  // Add catalog mutation
  const addCatalogMutation = api.catalog.add.useMutation();

  // Handle search on Enter key press
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchName.trim()) {
      setActualSearchQuery(searchName.trim());
    }
  };

  // Handle search button click
  const handleSearchClick = () => {
    if (searchName.trim()) {
      setActualSearchQuery(searchName.trim());
    }
  };

  // Validate API key when it changes
  useEffect(() => {
    if (apiKey.length > 10) {
      // Basic length check
      const timer = setTimeout(() => {
        validateApiKeyMutation
          .refetch()
          .then((result) => {
            if (result.data?.valid) {
              setApiKeyValid(true);
            } else {
              setApiKeyValid(false);
            }
          })
          .catch(() => {
            setApiKeyValid(false);
          });
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setApiKeyValid(null);
    }
  }, [apiKey, validateApiKeyMutation]);

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

    const catalogToAdd =
      activeTab === "browse" ? selectedCatalog : selectedSearchResult;

    if (!catalogToAdd) {
      toast({
        title: "No Catalog Selected",
        description: "Please select a catalog to add.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    try {
      // Add catalog using the existing catalog.add mutation
      await addCatalogMutation.mutateAsync({
        userId,
        manifestUrl: catalogToAdd.manifestUrl,
      });

      // Also call the parent callback for immediate UI update
      onAddCatalog({
        name: catalogToAdd.name,
        manifestUrl: catalogToAdd.manifestUrl,
        description: catalogToAdd.description,
      });

      toast({
        title: "Catalog Added Successfully",
        description: `${catalogToAdd.name} has been added to your collection.`,
      });

      // Reset form and close dialog
      handleClose();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to add catalog. Please try again.";
      toast({
        title: "Error Adding Catalog",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setSelectedCatalog(null);
    setSelectedSearchResult(null);
    setSearchQuery("");
    setSearchName("");
    setActualSearchQuery("");
    setApiKeyValid(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[80vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-primary" />
            <span>Add New MDBList Catalog</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col space-y-4 overflow-hidden">
          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="api-key" className="text-sm font-medium">
              MDBList API Key <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your MDBList API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
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
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://mdblist.com/api/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  mdblist.com/api/
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
              className="flex-1"
            >
              <Package className="h-4 w-4" />
              Browse Catalogs
            </Button>
            <Button
              variant={activeTab === "search" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("search")}
              className="flex-1"
            >
              <Search className="h-4 w-4" />
              Search Catalogs
            </Button>
          </div>

          {activeTab === "browse" ? (
            <div className="flex flex-1 flex-col space-y-4 overflow-hidden">
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
                {searchQuery.trim() && (
                  <p className="text-xs text-muted-foreground">
                    Found {filteredBrowseCatalogs.length} catalog
                    {filteredBrowseCatalogs.length !== 1 ? "s" : ""}
                    {searchQuery.trim() && ` matching "${searchQuery}"`}
                  </p>
                )}
              </div>

              {/* Catalog Grid */}
              <div className="flex-1 overflow-y-auto pr-2">
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
                          selectedCatalog?.id === catalog.id
                            ? "border-primary/50 ring-2 ring-primary"
                            : ""
                        }`}
                        onClick={() => setSelectedCatalog(catalog)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="flex items-center space-x-2 text-sm font-medium">
                                <span className="truncate">{catalog.name}</span>
                                {catalog.listType === "toplist" && (
                                  <Star className="h-3 w-3 text-yellow-500" />
                                )}
                              </CardTitle>
                            </div>
                            {selectedCatalog?.id === catalog.id && (
                              <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary" />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {catalog.description}
                          </p>

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

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3" />
                              <span>{catalog.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Download className="h-3 w-3" />
                              <span>{catalog.downloads}</span>
                            </div>
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
            <div className="flex-1 space-y-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Search MDBList Catalogs
                  </Label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search for catalogs by name, source, or category... (Press Enter to search)"
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
                    <p className="text-xs text-muted-foreground">
                      Found {filteredSearchResults.length} catalog
                      {filteredSearchResults.length !== 1 ? "s" : ""}
                      {actualSearchQuery && ` matching "${actualSearchQuery}"`}
                    </p>
                  )}
                </div>

                {/* Search Results Grid */}
                <div className="flex-1 overflow-y-auto pr-2">
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
                    <div className="grid grid-cols-1 gap-3">
                      {filteredSearchResults.map((result) => (
                        <Card
                          key={result.id}
                          className={`cursor-pointer border-border/50 bg-background/30 transition-all duration-200 hover:bg-background/50 ${
                            selectedSearchResult?.id === result.id
                              ? "border-primary/50 ring-2 ring-primary"
                              : ""
                          }`}
                          onClick={() => setSelectedSearchResult(result)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0 flex-1">
                                <CardTitle className="flex items-center space-x-2 text-sm font-medium">
                                  <span className="truncate">
                                    {result.name}
                                  </span>
                                  {result.listType === "toplist" && (
                                    <Star className="h-3 w-3 text-yellow-500" />
                                  )}
                                </CardTitle>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  from {result.source}
                                </p>
                              </div>
                              {selectedSearchResult?.id === result.id && (
                                <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary" />
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-0">
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {result.description}
                            </p>

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

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3" />
                                <span>{result.rating.toFixed(1)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Download className="h-3 w-3" />
                                <span>{result.downloads}</span>
                              </div>
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
                        additional content. Select a catalog to add it to your
                        collection.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isAdding}>
            Cancel
          </Button>
          <Button
            onClick={handleAddCatalog}
            disabled={
              isAdding ||
              apiKeyValid !== true ||
              (activeTab === "browse" && !selectedCatalog) ||
              (activeTab === "search" && !selectedSearchResult)
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
                Add Catalog
              </>
            )}
          </Button>
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
