import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  Sparkles,
  Loader2,
  GripVertical,
  Edit2,
  Shuffle,
  Play,
  Pause,
  Trash2,
} from "lucide-react";
import { isMDBListCatalogClient } from "@/lib/utils/mdblist-client-utils";

// Type definitions
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

interface Catalog {
  id: number;
  name: string;
  description: string;
  manifestUrl: string;
  status: string;
  randomized: boolean;
  rpdbEnabled: boolean;
  originalManifest: unknown;
}

interface CatalogListProps {
  catalogs: Catalog[];
  isLoading: boolean;
  hasRpdbApiKey: boolean;
  isTogglingRpdbForAll: boolean;
  editingId: number | null;
  editingName: string;
  draggedItem: number | null;

  // Event handlers
  onToggleRpdbForAll: () => Promise<void>;
  onStartEditing: (id: number, currentName: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  setEditingName: (name: string) => void;
  onRandomizeCatalogContent: (catalogId: number, catalogName: string) => void;
  onToggleRpdbEnabled: (catalogId: number, catalogName: string) => void;
  onToggleCatalogStatus: (catalogId: number) => void;
  onRemoveCatalog: (catalogId: number) => void;

  // Drag and drop handlers
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetId: number) => void;
}

export function CatalogList({
  catalogs,
  isLoading,
  hasRpdbApiKey,
  isTogglingRpdbForAll,
  editingId,
  editingName,
  draggedItem,
  onToggleRpdbForAll,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  setEditingName,
  onRandomizeCatalogContent,
  onToggleRpdbEnabled,
  onToggleCatalogStatus,
  onRemoveCatalog,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
}: CatalogListProps) {
  return (
    <Card className="h-fit border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Your Catalogs</CardTitle>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          {catalogs.length > 0 &&
            catalogs.some((c) => isMDBListCatalogClient(c.manifestUrl)) && (
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleRpdbForAll}
                disabled={!hasRpdbApiKey || isTogglingRpdbForAll}
                className={
                  !hasRpdbApiKey || isTogglingRpdbForAll
                    ? "h-7 cursor-not-allowed text-xs opacity-50"
                    : catalogs.filter(
                          (c) =>
                            c.rpdbEnabled &&
                            isMDBListCatalogClient(c.manifestUrl),
                        ).length <
                        catalogs.filter((c) =>
                          isMDBListCatalogClient(c.manifestUrl),
                        ).length /
                          2
                      ? "h-7 bg-blue-500/20 text-xs text-blue-500 hover:bg-blue-500/30"
                      : "h-7 text-xs"
                }
                title={
                  !hasRpdbApiKey
                    ? "Configure RPDB API key first to enable RPDB functionality"
                    : isTogglingRpdbForAll
                      ? "Processing RPDB changes..."
                      : "Toggle RPDB enhancement for all MDBList catalogs"
                }
              >
                {isTogglingRpdbForAll ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {!hasRpdbApiKey
                  ? "RPDB for All MDBLists (API Key Required)"
                  : isTogglingRpdbForAll
                    ? "Processing..."
                    : catalogs.filter(
                          (c) =>
                            c.rpdbEnabled &&
                            isMDBListCatalogClient(c.manifestUrl),
                        ).length <
                        catalogs.filter((c) =>
                          isMDBListCatalogClient(c.manifestUrl),
                        ).length /
                          2
                      ? "Enable RPDB for All MDBLists"
                      : "Disable RPDB for All MDBLists"}
              </Button>
            )}
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {catalogs.length} Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            <Loader2 className="mx-auto mb-4 h-16 w-16 animate-spin opacity-50" />
            <p className="text-lg font-medium">Loading your catalogs...</p>
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
              <CatalogItem
                key={catalog.id}
                catalog={catalog}
                isBeingDragged={draggedItem === catalog.id}
                isEditing={editingId === catalog.id}
                editingName={editingName}
                hasRpdbApiKey={hasRpdbApiKey}
                onStartEditing={onStartEditing}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
                onEditingNameChange={setEditingName}
                onRandomizeToggle={onRandomizeCatalogContent}
                onRpdbToggle={onToggleRpdbEnabled}
                onStatusToggle={onToggleCatalogStatus}
                onRemove={onRemoveCatalog}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragOver={onDragOver}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Individual Catalog Item Component
interface CatalogItemProps {
  catalog: Catalog;
  isBeingDragged: boolean;
  isEditing: boolean;
  editingName: string;
  hasRpdbApiKey: boolean;
  onStartEditing: (id: number, currentName: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditingNameChange: (name: string) => void;
  onRandomizeToggle: (catalogId: number, catalogName: string) => void;
  onRpdbToggle: (catalogId: number, catalogName: string) => void;
  onStatusToggle: (catalogId: number) => void;
  onRemove: (catalogId: number) => void;
  onDragStart: (e: React.DragEvent, id: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetId: number) => void;
}

function CatalogItem({
  catalog,
  isBeingDragged,
  isEditing,
  editingName,
  hasRpdbApiKey,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onEditingNameChange,
  onRandomizeToggle,
  onRpdbToggle,
  onStatusToggle,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
}: CatalogItemProps) {
  return (
    <div
      className={`rounded-lg border border-border/50 bg-background/30 transition-all ${
        isBeingDragged ? "opacity-50" : ""
      }`}
      draggable
      onDragStart={(e) => onDragStart(e, catalog.id)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, catalog.id)}
    >
      {/* Mobile Layout */}
      <div className="block md:hidden">
        <div className="space-y-2 p-3">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => onEditingNameChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSaveEdit();
                      if (e.key === "Escape") onCancelEdit();
                    }}
                    onBlur={onSaveEdit}
                    className="rounded border border-border/50 bg-background px-2 py-1 text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 md:text-sm"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => onStartEditing(catalog.id, catalog.name)}
                  className="group flex items-center space-x-1 rounded px-1 py-0.5 text-sm font-medium transition-colors hover:bg-muted/50"
                >
                  <span className="truncate">{catalog.name}</span>
                  <Edit2 className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
              <Badge
                variant={catalog.status === "active" ? "default" : "secondary"}
                className={
                  catalog.status === "active"
                    ? "border-green-500/20 bg-green-500/10 text-green-500"
                    : "border-yellow-500/20 bg-yellow-500/10 text-yellow-500"
                }
              >
                {catalog.status === "active" ? "Active" : "Inactive"}
              </Badge>
              <Badge
                variant={catalog.rpdbEnabled === true ? "default" : "default"}
                className={
                  catalog.rpdbEnabled === true
                    ? "border-blue-500/20 bg-blue-500/10 text-blue-500 hover:bg-blue-500/30"
                    : "hidden"
                }
              >
                {catalog.rpdbEnabled === true ? "RPDB" : ""}
              </Badge>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground">{catalog.description}</p>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Package className="h-3 w-3 flex-shrink-0" />
              <span>
                {(() => {
                  const manifest = catalog.originalManifest as StremioManifest;
                  return manifest?.types?.join(" & ") || "Movies & Series";
                })()}
              </span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center justify-end space-x-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRandomizeToggle(catalog.id, catalog.name)}
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
              onClick={() => onRpdbToggle(catalog.id, catalog.name)}
              disabled={
                !isMDBListCatalogClient(catalog.manifestUrl) || !hasRpdbApiKey
              }
              className={`h-9 w-9 p-0 ${
                !isMDBListCatalogClient(catalog.manifestUrl) || !hasRpdbApiKey
                  ? "cursor-not-allowed opacity-50"
                  : catalog.rpdbEnabled
                    ? "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
                    : "hover:bg-muted"
              }`}
              title={
                !isMDBListCatalogClient(catalog.manifestUrl)
                  ? "RPDB enhancement is only available for MDBList catalogs"
                  : !hasRpdbApiKey
                    ? "Configure RPDB API key first to enable RPDB functionality"
                    : `${
                        catalog.rpdbEnabled
                          ? "Disable RPDB Enhancement"
                          : "Enable RPDB Enhancement"
                      }`
              }
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusToggle(catalog.id)}
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
              onClick={() => onRemove(catalog.id)}
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
              {isEditing ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => onEditingNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveEdit();
                    if (e.key === "Escape") onCancelEdit();
                  }}
                  onBlur={onSaveEdit}
                  className="flex-1 rounded border border-border/50 bg-background px-2 py-1 text-base font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 md:text-sm"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => onStartEditing(catalog.id, catalog.name)}
                  className="group flex items-center space-x-1 rounded px-1 py-0.5 text-sm font-medium transition-colors hover:bg-muted/50"
                >
                  <span className="truncate">{catalog.name}</span>
                  <Edit2 className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
              <Badge
                variant={catalog.status === "active" ? "default" : "secondary"}
                className={
                  catalog.status === "active"
                    ? "border-green-500/20 bg-green-500/10 text-green-500"
                    : "border-yellow-500/20 bg-yellow-500/10 text-yellow-500"
                }
              >
                {catalog.status === "active" ? "Active" : "Inactive"}
              </Badge>
              <Badge
                variant={catalog.rpdbEnabled === true ? "default" : "default"}
                className={
                  catalog.rpdbEnabled === true
                    ? "border-blue-500/20 bg-blue-500/10 text-blue-500 hover:bg-blue-500/30"
                    : "hidden"
                }
              >
                {catalog.rpdbEnabled === true ? "RPDB" : ""}
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
                    return manifest?.types?.join(" & ") || "Movies & Series";
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
            onClick={() => onRandomizeToggle(catalog.id, catalog.name)}
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
            onClick={() => onRpdbToggle(catalog.id, catalog.name)}
            disabled={
              !isMDBListCatalogClient(catalog.manifestUrl) || !hasRpdbApiKey
            }
            className={`h-8 w-8 p-0 ${
              !isMDBListCatalogClient(catalog.manifestUrl) || !hasRpdbApiKey
                ? "cursor-not-allowed opacity-50"
                : catalog.rpdbEnabled
                  ? "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
                  : "hover:bg-muted"
            }`}
            title={
              !isMDBListCatalogClient(catalog.manifestUrl)
                ? "RPDB enhancement is only available for MDBList catalogs"
                : !hasRpdbApiKey
                  ? "Configure RPDB API key first to enable RPDB functionality"
                  : `${
                      catalog.rpdbEnabled
                        ? "Disable RPDB Enhancement"
                        : "Enable RPDB Enhancement"
                    }`
            }
          >
            <Sparkles className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStatusToggle(catalog.id)}
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
            onClick={() => onRemove(catalog.id)}
            className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
