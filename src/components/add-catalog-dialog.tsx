"use client";

import { useState } from "react";
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
  Globe,
  Star,
  Download,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Mock catalog data
const MOCK_CATALOGS = [
  {
    id: 1,
    name: "IMDB Top 250 Movies",
    description: "The most popular and highest-rated movies according to IMDB",
    manifestUrl: "https://example.com/imdb-top-250/manifest.json",
    types: ["movie"],
    rating: 4.9,
    downloads: "2.3M",
    featured: true,
  },
  {
    id: 2,
    name: "Netflix Originals",
    description: "Exclusive Netflix original series and movies",
    manifestUrl: "https://example.com/netflix-originals/manifest.json",
    types: ["movie", "series"],
    rating: 4.7,
    downloads: "1.8M",
    featured: true,
  },
  {
    id: 3,
    name: "Classic TV Shows",
    description: "Timeless television series from the golden age",
    manifestUrl: "https://example.com/classic-tv/manifest.json",
    types: ["series"],
    rating: 4.5,
    downloads: "945K",
    featured: false,
  },
  {
    id: 4,
    name: "Documentary Collection",
    description: "Educational and thought-provoking documentaries",
    manifestUrl: "https://example.com/documentaries/manifest.json",
    types: ["movie"],
    rating: 4.6,
    downloads: "687K",
    featured: false,
  },
  {
    id: 5,
    name: "Anime Series Hub",
    description: "Popular anime series from various genres",
    manifestUrl: "https://example.com/anime-hub/manifest.json",
    types: ["series"],
    rating: 4.8,
    downloads: "1.2M",
    featured: true,
  },
  {
    id: 6,
    name: "Horror Movie Vault",
    description: "Spine-chilling horror movies for thrill seekers",
    manifestUrl: "https://example.com/horror-vault/manifest.json",
    types: ["movie"],
    rating: 4.3,
    downloads: "523K",
    featured: false,
  },
];

// Mock search results for external catalog search
const MOCK_SEARCH_RESULTS = [
  {
    id: 101,
    name: "4K Movies Collection",
    description: "High-quality 4K movies from various genres",
    manifestUrl: "https://example.com/4k-movies/manifest.json",
    types: ["movie"],
    rating: 4.8,
    downloads: "892K",
    source: "CinemaHub",
  },
  {
    id: 102,
    name: "Retro TV Classics",
    description: "Classic TV shows from the 80s and 90s",
    manifestUrl: "https://example.com/retro-tv/manifest.json",
    types: ["series"],
    rating: 4.6,
    downloads: "456K",
    source: "VintageStream",
  },
  {
    id: 103,
    name: "International Cinema",
    description: "Foreign films with subtitles from around the world",
    manifestUrl: "https://example.com/international/manifest.json",
    types: ["movie"],
    rating: 4.7,
    downloads: "321K",
    source: "WorldCinema",
  },
  {
    id: 104,
    name: "Kids & Family",
    description: "Safe, family-friendly content for children",
    manifestUrl: "https://example.com/kids-family/manifest.json",
    types: ["movie", "series"],
    rating: 4.5,
    downloads: "789K",
    source: "FamilyStream",
  },
  {
    id: 105,
    name: "Sci-Fi Universe",
    description: "Science fiction movies and series collection",
    manifestUrl: "https://example.com/scifi/manifest.json",
    types: ["movie", "series"],
    rating: 4.9,
    downloads: "1.1M",
    source: "SciFiHub",
  },
];

interface AddCatalogDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCatalog: (catalog: {
    name: string;
    manifestUrl: string;
    description: string;
  }) => void;
}

export function AddCatalogDialog({
  isOpen,
  onOpenChange,
  onAddCatalog,
}: AddCatalogDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [selectedCatalog, setSelectedCatalog] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "search">("browse");

  // Search catalog states
  const [searchName, setSearchName] = useState("");
  const [selectedSearchResult, setSelectedSearchResult] = useState<
    number | null
  >(null);

  // Filter search results based on search query
  const filteredSearchResults = MOCK_SEARCH_RESULTS.filter(
    (result) =>
      searchName.trim() === "" ||
      result.name.toLowerCase().includes(searchName.toLowerCase()) ||
      result.description.toLowerCase().includes(searchName.toLowerCase()) ||
      result.source.toLowerCase().includes(searchName.toLowerCase()) ||
      result.types.some((type) =>
        type.toLowerCase().includes(searchName.toLowerCase()),
      ),
  );

  // Sort search results by rating
  const sortedSearchResults = filteredSearchResults.sort(
    (a, b) => b.rating - a.rating,
  );

  // Filter catalogs based on search query
  const filteredCatalogs = MOCK_CATALOGS.filter(
    (catalog) =>
      searchQuery.trim() === "" ||
      catalog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      catalog.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      catalog.types.some((type) =>
        type.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  // Sort catalogs: featured first, then by rating
  const sortedCatalogs = filteredCatalogs.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return b.rating - a.rating;
  });

  const handleAddCatalog = async () => {
    // Check if API key is provided
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your API key to add catalogs.",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    try {
      if (activeTab === "browse" && selectedCatalog) {
        const catalog = MOCK_CATALOGS.find((c) => c.id === selectedCatalog);
        if (catalog) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
          onAddCatalog({
            name: catalog.name,
            manifestUrl: catalog.manifestUrl,
            description: catalog.description,
          });

          toast({
            title: "Catalog Added Successfully",
            description: `${catalog.name} has been added to your collection.`,
          });
        }
      } else if (activeTab === "search") {
        if (!selectedSearchResult) {
          toast({
            title: "No Catalog Selected",
            description: "Please select a catalog from the search results.",
            variant: "destructive",
          });
          setIsAdding(false);
          return;
        }

        const searchResult = MOCK_SEARCH_RESULTS.find(
          (c) => c.id === selectedSearchResult,
        );
        if (searchResult) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
          onAddCatalog({
            name: searchResult.name,
            manifestUrl: searchResult.manifestUrl,
            description: searchResult.description,
          });

          toast({
            title: "MDBList Catalog Added",
            description: `${searchResult.name} has been added to your collection.`,
          });
        }
      }

      // Reset form
      setSelectedCatalog(null);
      setSelectedSearchResult(null);
      setSearchName("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add catalog. Please try again.",
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
              API Key <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your API key (required)..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={`border-border/50 bg-background/50 pl-10 ${
                  !apiKey.trim() ? "border-red-500/50" : ""
                }`}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A valid API key is required to access MDBList catalogs.
            </p>
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
                    placeholder="Search catalogs by name, description, or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-border/50 bg-background/50 pl-10"
                  />
                </div>
                {searchQuery.trim() && (
                  <p className="text-xs text-muted-foreground">
                    Found {sortedCatalogs.length} catalog
                    {sortedCatalogs.length !== 1 ? "s" : ""}
                    {searchQuery.trim() && ` matching "${searchQuery}"`}
                  </p>
                )}
              </div>

              {/* Catalog Grid */}
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {sortedCatalogs.map((catalog) => (
                    <Card
                      key={catalog.id}
                      className={`cursor-pointer border-border/50 bg-background/30 transition-all duration-200 hover:bg-background/50 ${
                        selectedCatalog === catalog.id
                          ? "border-primary/50 ring-2 ring-primary"
                          : ""
                      }`}
                      onClick={() => setSelectedCatalog(catalog.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="flex items-center space-x-2 text-sm font-medium">
                              <span className="truncate">{catalog.name}</span>
                              {catalog.featured && (
                                <Star className="h-3 w-3 text-yellow-500" />
                              )}
                            </CardTitle>
                          </div>
                          {selectedCatalog === catalog.id && (
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
                            <span>{catalog.rating}</span>
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

                {sortedCatalogs.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <Package className="mx-auto mb-4 h-16 w-16 opacity-50" />
                    <p className="text-lg font-medium">No catalogs found</p>
                    <p className="text-sm">
                      Try adjusting your search terms or browse all catalogs
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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search for catalogs by name, source, or category..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className="border-border/50 bg-background/50 pl-10"
                    />
                  </div>
                  {searchName.trim() && (
                    <p className="text-xs text-muted-foreground">
                      Found {sortedSearchResults.length} catalog
                      {sortedSearchResults.length !== 1 ? "s" : ""}
                      {searchName.trim() && ` matching "${searchName}"`}
                    </p>
                  )}
                </div>

                {/* Search Results Grid */}
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 gap-3">
                    {sortedSearchResults.map((result) => (
                      <Card
                        key={result.id}
                        className={`cursor-pointer border-border/50 bg-background/30 transition-all duration-200 hover:bg-background/50 ${
                          selectedSearchResult === result.id
                            ? "border-primary/50 ring-2 ring-primary"
                            : ""
                        }`}
                        onClick={() => setSelectedSearchResult(result.id)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="flex items-center space-x-2 text-sm font-medium">
                                <span className="truncate">{result.name}</span>
                              </CardTitle>
                              <p className="mt-1 text-xs text-muted-foreground">
                                from {result.source}
                              </p>
                            </div>
                            {selectedSearchResult === result.id && (
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
                              <span>{result.rating}</span>
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

                  {sortedSearchResults.length === 0 && searchName.trim() && (
                    <div className="py-12 text-center text-muted-foreground">
                      <Search className="mx-auto mb-4 h-16 w-16 opacity-50" />
                      <p className="text-lg font-medium">No catalogs found</p>
                      <p className="text-sm">
                        Try different search terms or browse the main catalog
                      </p>
                    </div>
                  )}

                  {sortedSearchResults.length === 0 && !searchName.trim() && (
                    <div className="py-12 text-center text-muted-foreground">
                      <Search className="mx-auto mb-4 h-16 w-16 opacity-50" />
                      <p className="text-lg font-medium">Start Searching</p>
                      <p className="text-sm">
                        Enter a search term to find MDBList catalogs
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
                        Search through MDBList catalog sources to find
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
              !apiKey.trim() ||
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
