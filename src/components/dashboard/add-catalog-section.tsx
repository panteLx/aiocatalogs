import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Link2, Loader2 } from "lucide-react";
import { AddCatalogTrigger } from "@/components/forms/add-catalog-dialog";
import { RPDBConfigTrigger } from "@/components/forms/rpdb-config-dialog";

interface AddCatalogSectionProps {
  catalogUrl: string;
  setCatalogUrl: (url: string) => void;
  isAddingCatalog: boolean;
  onAddCatalog: () => Promise<void>;
  transformStremioUrl: (url: string) => string;
  onOpenAddDialog: () => void;
  userId: string;
  onRpdbConfigured: () => void;
}

export function AddCatalogSection({
  catalogUrl,
  setCatalogUrl,
  isAddingCatalog,
  onAddCatalog,
  transformStremioUrl,
  onOpenAddDialog,
  userId,
  onRpdbConfigured,
}: AddCatalogSectionProps) {
  return (
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
                    const transformedValue = transformStremioUrl(inputValue);
                    setCatalogUrl(transformedValue);
                  }}
                  className="border-border/50 bg-background/50 pl-10"
                />
              </div>
              <Button
                onClick={onAddCatalog}
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
                onClick={() => onOpenAddDialog()}
                disabled={isAddingCatalog}
                className="flex-1 sm:flex-none"
              />
              <RPDBConfigTrigger
                userId={userId}
                className="flex-1 sm:flex-none"
                onApiKeySaved={() => void onRpdbConfigured()}
              >
                <Plus className="h-4 w-4" /> RPDB Configuration
              </RPDBConfigTrigger>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Use the &quot;Add MDBList Catalogs&quot; button to browse the
            MDBList catalog library, or quickly add a manifest URL directly in
            the input field above.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
