import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils/changelog-utils";
import { MarkdownContent } from "./markdown-renderer";
import { ChangelogFeatureItem } from "./changelog-feature-item";
import type { ParsedChangelogEntry } from "@/types/changelog";

export function ChangelogEntry({ entry }: { entry: ParsedChangelogEntry }) {
  const hasStructuredContent =
    entry.features.length > 0 ||
    entry.improvements.length > 0 ||
    entry.bugfixes.length > 0;

  return (
    <div className="space-y-4 border-l-2 border-primary/20 pl-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant={entry.isPrerelease ? "secondary" : "default"}
            className={
              entry.isPrerelease
                ? "bg-secondary/20 text-secondary-foreground hover:bg-secondary/30"
                : "bg-primary/20 text-primary hover:bg-primary/30"
            }
          >
            v{entry.version}
            {entry.isPrerelease && " (pre-release)"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            ({formatDate(entry.publishedAt)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(entry.url, "_blank")}
            className="h-8 text-xs"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            View Release
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {entry.importantNote && (
          <div className="rounded-md border border-amber-200/20 bg-amber-50/10 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                <strong>[!IMPORTANT]</strong> {entry.importantNote}
              </p>
            </div>
          </div>
        )}

        {hasStructuredContent ? (
          <div className="space-y-3">
            {entry.features.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Features</h4>
                <div className="space-y-1">
                  {entry.features.map((feature, index) => (
                    <ChangelogFeatureItem key={index} text={feature} />
                  ))}
                </div>
              </div>
            )}

            {entry.improvements.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Improvements</h4>
                <div className="space-y-1">
                  {entry.improvements.map((improvement, index) => (
                    <ChangelogFeatureItem key={index} text={improvement} />
                  ))}
                </div>
              </div>
            )}

            {entry.bugfixes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Bug Fixes</h4>
                <div className="space-y-1">
                  {entry.bugfixes.map((bugfix, index) => (
                    <ChangelogFeatureItem key={index} text={bugfix} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          entry.rawContent && (
            <div className="text-sm text-muted-foreground">
              <MarkdownContent content={entry.rawContent} />
            </div>
          )
        )}
      </div>
    </div>
  );
}
