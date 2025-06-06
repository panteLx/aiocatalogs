"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Github,
  ChevronDown,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { ChangelogEntry } from "./changelog-entry";
import { useChangelog } from "@/hooks/use-changelog";
import type { ChangelogProps } from "@/types/changelog";

export function Changelog({ includePrerelease = false }: ChangelogProps) {
  const {
    allChangelogs,
    loadingMore,
    hasLoadedInitial,
    hasMoreData,
    isLoading,
    error,
    githubRepoUrl,
    loadMoreChangelogs,
  } = useChangelog({ includePrerelease });

  if (error) {
    return (
      <div className="mt-16 w-full max-w-4xl">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              What&apos;s New
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-md border border-destructive/20 bg-destructive/10 p-4">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-destructive" />
              <div className="text-sm">
                <p className="font-medium text-destructive">
                  Failed to load changelog
                </p>
                <p className="mt-1 text-destructive/80">{error.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-16 w-full max-w-4xl">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                What&apos;s New
              </CardTitle>
              <CardDescription>
                View the latest changes for this version
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={() =>
                githubRepoUrl && window.open(githubRepoUrl, "_blank")
              }
              disabled={!githubRepoUrl}
            >
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="max-h-[50vh] space-y-6 overflow-y-auto">
          {isLoading && allChangelogs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">
                Loading changelog...
              </span>
            </div>
          ) : allChangelogs.length > 0 ? (
            <>
              {allChangelogs.map((entry) => (
                <ChangelogEntry key={entry.version} entry={entry} />
              ))}

              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading more changelogs...
                  </span>
                </div>
              )}

              {hasMoreData && !loadingMore && (
                <div className="space-y-3 py-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadMoreChangelogs()}
                    disabled={loadingMore || isLoading}
                  >
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Load More Changelogs (3 more)
                  </Button>
                </div>
              )}
            </>
          ) : hasLoadedInitial ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>No changelog entries found.</p>
              <p className="mt-1 text-sm">Check back later for updates!</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
