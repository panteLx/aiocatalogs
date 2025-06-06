import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Info, Copy, Play } from "lucide-react";

interface UnifiedManifestCardProps {
  catalogsCount: number;
  activeCatalogsCount: number;
  userId: string;
  onCopyUrl: (url: string) => void;
  onAddToStremio: () => void;
}

export function UnifiedManifestCard({
  catalogsCount,
  activeCatalogsCount,
  userId,
  onCopyUrl,
  onAddToStremio,
}: UnifiedManifestCardProps) {
  if (catalogsCount === 0 || activeCatalogsCount === 0) {
    return null;
  }

  return (
    <Card className="h-fit border-border/50 border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Your Unified Catalog</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Your unified manifest combining all {activeCatalogsCount} active
          catalogs
        </p>

        <div className="flex items-start space-x-2 rounded-md border border-blue-500/20 bg-blue-500/10 p-3">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
          <div className="text-xs text-blue-600 dark:text-blue-400">
            <p className="font-medium">Important Note</p>
            <p className="mt-1">
              You need to reinstall the addon after adding, removing or renaming
              catalogs.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-background/30 p-3">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Manifest URL:</span>
            </div>
            <div className="rounded border bg-muted/50 p-2">
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
                  onCopyUrl(
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
                onClick={onAddToStremio}
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                Add to Stremio
              </Button>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Install your unified catalog addon by adding the URL to your favorite
          streaming app.
        </p>
      </CardContent>
    </Card>
  );
}
