import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface DashboardContentProps {
  userId: string;
}

// Mock data für die Cataloge
const mockCatalogs = [
  {
    id: "1",
    name: "Torrentio",
    url: "https://torrentio.strem.fun/manifest.json",
    description: "Provides torrent streams from various sources",
    status: "active",
    addedAt: "2025-06-01T10:00:00Z",
  },
  {
    id: "2",
    name: "Pirate Bay+",
    url: "https://tpb-plus.herokuapp.com/manifest.json",
    description: "Enhanced Pirate Bay addon with improved search",
    status: "active",
    addedAt: "2025-06-02T14:30:00Z",
  },
  {
    id: "3",
    name: "OpenSubtitles",
    url: "https://opensubtitles-v3.strem.io/manifest.json",
    description: "Subtitle provider for movies and TV shows",
    status: "inactive",
    addedAt: "2025-06-03T09:15:00Z",
  },
];

export function DashboardContent({ userId }: DashboardContentProps) {
  const [catalogUrl, setCatalogUrl] = useState("");
  const [catalogs, setCatalogs] = useState(mockCatalogs);

  const handleAddCatalog = () => {
    if (!catalogUrl.trim()) return;

    // Mock adding a catalog
    const newCatalog = {
      id: Date.now().toString(),
      name: "New Catalog",
      url: catalogUrl,
      description: "Newly added catalog",
      status: "active" as const,
      addedAt: new Date().toISOString(),
    };

    setCatalogs([...catalogs, newCatalog]);
    setCatalogUrl("");

    // Show success toast
    toast({
      title: "Catalog Added",
      description:
        "The catalog has been successfully added to your collection.",
    });
  };

  const handleRemoveCatalog = (id: string) => {
    setCatalogs(catalogs.filter((catalog) => catalog.id !== id));

    // Show success toast
    toast({
      title: "Catalog Removed",
      description: "The catalog has been removed from your collection.",
    });
  };

  const handleCopyUrl = (url: string) => {
    void navigator.clipboard.writeText(url);

    // Show success toast
    toast({
      title: "URL Copied",
      description: "The URL has been copied to your clipboard.",
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

      {/* Top Section - User Info and Add Catalog in one row */}
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
            <div className="space-y-2">
              <Label htmlFor="catalog-url" className="text-sm font-medium">
                Manifest URL
              </Label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="catalog-url"
                    type="url"
                    placeholder="https://example.com/manifest.json"
                    value={catalogUrl}
                    onChange={(e) => setCatalogUrl(e.target.value)}
                    className="border-border/50 bg-background/50 pl-10"
                  />
                </div>
                <Button
                  onClick={handleAddCatalog}
                  disabled={!catalogUrl.trim()}
                  className="px-6"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter the URL of a Stremio addon manifest.json file
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Section */}
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-2xl font-bold text-transparent">
            Featured
          </h2>
        </div>

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
                    Premium streaming addon
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
                {catalogs.length === 0 ? (
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
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-background/30 p-4"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="truncate text-sm font-medium">
                              {catalog.name}
                            </h4>
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
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            <span className="truncate font-mono">
                              {catalog.url}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyUrl(catalog.url)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(catalog.url, "_blank")}
                            className="h-8 w-8 p-0"
                          >
                            <ExternalLink className="h-4 w-4" />
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
                    <div className="rounded-lg border border-border/50 bg-background/30 p-3">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-primary" />
                          <span className="break-all font-mono text-xs">
                            {typeof window !== "undefined"
                              ? `${window.location.origin}/api/manifest/${userId}`
                              : `/api/manifest/${userId}`}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleCopyUrl(
                              typeof window !== "undefined"
                                ? `${window.location.origin}/api/manifest/${userId}`
                                : `/api/manifest/${userId}`,
                            )
                          }
                          className="w-full"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Manifest URL
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use this URL in Stremio to install your unified catalog
                      addon
                    </p>
                  </CardContent>
                </Card>
              )}
          </div>
        </div>
      </div>

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
    </div>
  );
}
