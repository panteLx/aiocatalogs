"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Download,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "@/trpc/react";
import { toast } from "@/hooks/ui/use-toast";

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

interface SharePageProps {
  params: { shareId: string };
}

export default function SharePage({ params }: SharePageProps) {
  const { shareId } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();

  // Get userId from Clerk if authenticated, otherwise fall back to URL parameter
  const urlUserId = searchParams.get("userId");
  const userId = isLoaded && user ? user.id : urlUserId;

  const [selectedCatalogs, setSelectedCatalogs] = useState<number[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Update URL when Clerk user is loaded
  useEffect(() => {
    if (isLoaded && user && !urlUserId) {
      const url = new URL(window.location.href);
      url.searchParams.set("userId", user.id);
      window.history.replaceState({}, "", url.toString());
    }
  }, [isLoaded, user, urlUserId]);

  // Fetch shared catalog data
  const {
    data: shareData,
    isLoading,
    error,
  } = api.share.get.useQuery({
    shareId,
  });

  // Import mutation
  const importMutation = api.share.import.useMutation({
    onSuccess: (result) => {
      setIsImporting(false);
      toast({
        title: "Catalogs Imported Successfully",
        description: `${result.importedCount} catalog(s) added to your collection. ${result.skippedCount > 0 ? `${result.skippedCount} already existed.` : ""}`,
      });

      if (userId) {
        router.push(`/${userId}`);
      }
    },
    onError: (error) => {
      setIsImporting(false);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import catalogs",
        variant: "destructive",
      });
    },
  });

  const handleSelectCatalog = (catalogId: number) => {
    setSelectedCatalogs((prev) =>
      prev.includes(catalogId)
        ? prev.filter((id) => id !== catalogId)
        : [...prev, catalogId],
    );
  };

  const handleSelectAll = () => {
    if (!shareData?.catalogs) return;

    if (selectedCatalogs.length === shareData.catalogs.length) {
      setSelectedCatalogs([]);
    } else {
      setSelectedCatalogs(shareData.catalogs.map((c) => c.id));
    }
  };

  const handleImport = () => {
    if (!userId) {
      toast({
        title: "Authentication Required",
        description: "Please provide your User ID to import catalogs",
        variant: "destructive",
      });
      return;
    }

    if (selectedCatalogs.length === 0) {
      toast({
        title: "No Catalogs Selected",
        description: "Please select at least one catalog to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    importMutation.mutate({
      userId,
      shareId,
      selectedCatalogIds: selectedCatalogs,
    });
  };

  const formatDate = (timestamp: number | Date) => {
    const date =
      typeof timestamp === "number" ? new Date(timestamp * 1000) : timestamp;
    return date.toLocaleDateString();
  };

  const isExpired =
    shareData?.shareInfo.expiresAt &&
    shareData.shareInfo.expiresAt.getTime() < Date.now();

  if (isLoading) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center pt-16">
        <div className="relative z-10 flex items-center justify-center py-12">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading shared catalog...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error ?? !shareData) {
    return (
      <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center pt-16">
        <div className="container relative z-10 mx-auto px-4 py-8">
          <div className="mx-auto max-w-2xl">
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                <h1 className="mb-2 text-xl font-semibold text-red-500">
                  Share Not Found
                </h1>
                <p className="mb-4 text-muted-foreground">
                  {error?.message ??
                    "The shared catalog you're looking for doesn't exist or has been removed."}
                </p>
                <Button onClick={() => router.push("/")} variant="outline">
                  Go to Homepage
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex-1 pt-16">
      <div className="container relative z-10 mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center">
              <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-3xl font-bold text-transparent">
                Shared Catalog Collection
              </h1>
            </div>
            <p className="text-muted-foreground">
              Import these shared catalogs to your collection and enhance your
              streaming experience
            </p>
          </div>

          {/* Share Info Card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-xl">
                    {shareData.shareInfo.name}
                  </CardTitle>
                  {shareData.shareInfo.description && (
                    <p className="text-muted-foreground">
                      {shareData.shareInfo.description}
                    </p>
                  )}
                </div>
                {isExpired && (
                  <Badge
                    variant="destructive"
                    className="border-red-500/20 bg-red-500/10 text-red-500"
                  >
                    Expired
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Created {formatDate(shareData.shareInfo.createdAt)}
                  </span>
                </div>
                {shareData.shareInfo.expiresAt && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {isExpired ? "Expired" : "Expires"}{" "}
                      {formatDate(shareData.shareInfo.expiresAt)}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4" />
                  <span>{shareData.catalogs.length} catalog(s)</span>
                </div>
              </div>

              {/* User ID Input and Import Controls */}
              {!isExpired && (
                <div className="border-t border-border/50 pt-4">
                  <div className="flex flex-col items-end gap-4 sm:flex-row">
                    <div className="flex-1">
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Your User ID{" "}
                        {isLoaded && user
                          ? "(automatically detected)"
                          : "(required to import)"}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          isLoaded && user
                            ? "Automatically using your account"
                            : "Enter your User ID"
                        }
                        value={userId ?? ""}
                        onChange={(e) => {
                          if (!isLoaded || !user) {
                            const newUserId = e.target.value;
                            const url = new URL(window.location.href);
                            if (newUserId) {
                              url.searchParams.set("userId", newUserId);
                            } else {
                              url.searchParams.delete("userId");
                            }
                            window.history.replaceState({}, "", url.toString());
                          }
                        }}
                        disabled={isLoaded && !!user}
                        className={`w-full rounded-md border border-border/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                          isLoaded && user
                            ? "cursor-not-allowed bg-muted/50 text-muted-foreground"
                            : "bg-background/50"
                        }`}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={handleSelectAll}
                        disabled={shareData.catalogs.length === 0}
                      >
                        {selectedCatalogs.length === shareData.catalogs.length
                          ? "Deselect All"
                          : "Select All"}
                      </Button>
                      <Button
                        onClick={handleImport}
                        disabled={
                          !userId ||
                          selectedCatalogs.length === 0 ||
                          isImporting
                        }
                      >
                        {isImporting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Import Selected ({selectedCatalogs.length})
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Catalogs Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shareData.catalogs.map((catalog) => {
              const manifest = catalog.originalManifest as StremioManifest;
              const isSelected = selectedCatalogs.includes(catalog.id);

              return (
                <Card
                  key={catalog.id}
                  className={`cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:bg-card/70 ${
                    isSelected ? "border-primary/30 ring-2 ring-primary/50" : ""
                  } ${isExpired ? "opacity-50" : ""}`}
                  onClick={() => !isExpired && handleSelectCatalog(catalog.id)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="truncate font-medium">
                            {catalog.name}
                          </h3>
                          <p className="line-clamp-2 text-xs text-muted-foreground">
                            {catalog.description}
                          </p>
                        </div>
                        {!isExpired && (
                          <div className="ml-2 flex-shrink-0">
                            {isSelected ? (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-border" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Package className="h-3 w-3" />
                          <span>
                            {manifest?.types?.join(" & ") || "Movies & Series"}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`${catalog.status === "active" ? "border-green-500/20 bg-green-500/10 text-green-500" : "border-gray-500/20 bg-gray-500/10 text-gray-500"}`}
                        >
                          {catalog.status}
                        </Badge>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between border-t border-border/20 pt-2">
                        <span className="text-xs text-muted-foreground">
                          {manifest?.catalogs?.length || 0} catalog(s)
                        </span>
                        {catalog.randomized && (
                          <Badge
                            variant="outline"
                            className="border-purple-500/30 text-xs text-purple-400"
                          >
                            Randomized
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
