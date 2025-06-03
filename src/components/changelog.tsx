"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  Github,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/trpc/react";

interface ChangelogProps {
  includePrerelease?: boolean;
}

interface ParsedChangelogEntry {
  version: string;
  title: string;
  publishedAt: string;
  url: string;
  isPrerelease: boolean;
  importantNote?: string;
  features: string[];
  improvements: string[];
  bugfixes: string[];
  rawContent?: string;
}

function parseChangelogContent(
  content: string,
): Omit<
  ParsedChangelogEntry,
  "version" | "title" | "publishedAt" | "url" | "isPrerelease"
> {
  const result = {
    importantNote: undefined as string | undefined,
    features: [] as string[],
    improvements: [] as string[],
    bugfixes: [] as string[],
    rawContent: content,
  };

  // Extract important note
  const importantMatch = content.match(/\[!IMPORTANT\]\s*(.*?)(?=\n\n|##|$)/s);
  if (importantMatch?.[1]) {
    result.importantNote = importantMatch[1].trim();
  }

  // Extract features
  const featuresMatch = content.match(/##\s*Features\s*\n(.*?)(?=\n##|$)/s);
  if (featuresMatch?.[1]) {
    result.features = featuresMatch[1]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("*"))
      .map((line) => line.replace(/^\*\s*/, ""));
  }

  // Extract improvements
  const improvementsMatch = content.match(
    /##\s*Improvements\s*\n(.*?)(?=\n##|$)/s,
  );
  if (improvementsMatch?.[1]) {
    result.improvements = improvementsMatch[1]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("*"))
      .map((line) => line.replace(/^\*\s*/, ""));
  }

  // Extract bug fixes
  const bugfixesMatch = content.match(/##\s*Bug Fixes\s*\n(.*?)(?=\n##|$)/s);
  if (bugfixesMatch?.[1]) {
    result.bugfixes = bugfixesMatch[1]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("*"))
      .map((line) => line.replace(/^\*\s*/, ""));
  }

  return result;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// Custom Markdown content renderer with proper styling
function MarkdownContent({ content }: { content: string }) {
  // Replace @username with styled username with avatar
  const processedContent = content.replace(
    /\s@([a-zA-Z0-9_-]+)/g,
    (match, username) => {
      return `[@${username}](https://github.com/${username})`;
    },
  );

  // Replace issue links with proper formatting
  const enhancedContent = processedContent.replace(
    /(https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/(\d+))/g,
    (match, url, issueNumber) => {
      return `[#${issueNumber}](${url})`;
    },
  );

  // Remove <samp> tags and properly format commit hashes
  let modifiedContent = enhancedContent.replace(
    /<samp>\(([a-f0-9]{5,7})\)<\/samp>/g,
    "",
  );

  // Custom components for rendering specific markdown elements
  const components = {
    a: ({ node, href, children, ...props }: any) => {
      const isGitHubUser =
        href?.includes("https://github.com/") && href.split("/").length === 4;

      if (isGitHubUser) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex items-center font-medium text-foreground no-underline hover:underline"
            {...props}
          >
            {children}
          </a>
        );
      }

      // For all other links
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary no-underline hover:underline"
          {...props}
        >
          {children}
        </a>
      );
    },

    code: ({ node, inline, children, ...props }: any) => {
      // Special handling for commit hashes in <samp> tags
      if (
        props.className === "language-samp" ||
        (inline && children.toString().match(/^[a-f0-9]{5,7}$/))
      ) {
        return (
          <samp className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-xs">
            {children}
          </samp>
        );
      }

      return inline ? (
        <code
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs"
          {...props}
        >
          {children}
        </code>
      ) : (
        <pre className="overflow-auto rounded-md bg-muted p-4">
          <code className="font-mono text-xs" {...props}>
            {children}
          </code>
        </pre>
      );
    },
  };

  return (
    <div className="markdown-content prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown components={components}>{modifiedContent}</ReactMarkdown>
    </div>
  );
}

function ChangelogFeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></div>
      <div className="flex-1 text-sm">
        <MarkdownContent content={text} />
      </div>
    </div>
  );
}

function ChangelogEntry({
  entry,
  showFullContent = false,
}: {
  entry: ParsedChangelogEntry;
  showFullContent?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(showFullContent);
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
          {hasStructuredContent && !showFullContent && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
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
          <div
            className={`space-y-3 ${showFullContent || isExpanded ? "" : "line-clamp-3"}`}
          >
            {entry.features.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Features</h4>
                <div className="space-y-1">
                  {entry.features
                    .slice(0, showFullContent || isExpanded ? undefined : 2)
                    .map((feature, index) => (
                      <ChangelogFeatureItem key={index} text={feature} />
                    ))}
                  {!showFullContent &&
                    !isExpanded &&
                    entry.features.length > 2 && (
                      <div className="ml-4 text-xs text-muted-foreground">
                        +{entry.features.length - 2} more features...
                      </div>
                    )}
                </div>
              </div>
            )}

            {(showFullContent || isExpanded) &&
              entry.improvements.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">
                    Improvements
                  </h4>
                  <div className="space-y-1">
                    {entry.improvements.map((improvement, index) => (
                      <ChangelogFeatureItem key={index} text={improvement} />
                    ))}
                  </div>
                </div>
              )}

            {(showFullContent || isExpanded) && entry.bugfixes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Bug Fixes</h4>
                <div className="space-y-1">
                  {entry.bugfixes.map((bugfix, index) => (
                    <ChangelogFeatureItem key={index} text={bugfix} />
                  ))}
                </div>
              </div>
            )}

            {!showFullContent &&
              !isExpanded &&
              (entry.improvements.length > 0 || entry.bugfixes.length > 0) && (
                <div className="text-xs text-muted-foreground">
                  Click to view{" "}
                  {entry.improvements.length > 0
                    ? `${entry.improvements.length} improvements`
                    : ""}
                  {entry.improvements.length > 0 && entry.bugfixes.length > 0
                    ? " and "
                    : ""}
                  {entry.bugfixes.length > 0
                    ? `${entry.bugfixes.length} bug fixes`
                    : ""}
                  ...
                </div>
              )}
          </div>
        ) : (
          entry.rawContent && (
            <div className="text-sm text-muted-foreground">
              {showFullContent || isExpanded ? (
                <MarkdownContent content={entry.rawContent} />
              ) : (
                <div className="line-clamp-3">
                  <MarkdownContent content={entry.rawContent} />
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export function Changelog({ includePrerelease = false }: ChangelogProps) {
  const [allChangelogs, setAllChangelogs] = useState<ParsedChangelogEntry[]>(
    [],
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Initial load: 1 changelog, then 3 for each "Load More"
  const getItemsPerPage = () => (currentOffset === 0 ? 1 : 3);

  // Fetch changelogs with pagination
  const { data, isLoading, error } = api.changelog.getChangelog.useQuery({
    limit: getItemsPerPage(),
    offset: currentOffset,
    includePrerelease,
  });

  // Handle data updates
  useEffect(() => {
    if (data?.entries) {
      const parsedEntries = data.entries.map((entry) => ({
        ...entry,
        ...parseChangelogContent(entry.content),
      }));

      if (currentOffset === 0) {
        // Initial load
        setAllChangelogs(parsedEntries);
        setHasLoadedInitial(true);
      } else {
        // Loading more
        setAllChangelogs((prev) => [...prev, ...parsedEntries]);
      }

      // Check if we have more data from the API response
      const expectedCount = getItemsPerPage();
      setHasMoreData(data.hasMore ?? parsedEntries.length === expectedCount);
      setLoadingMore(false);
    }
  }, [data, currentOffset]);

  // Load more changelogs function
  const loadMoreChangelogs = () => {
    if (hasMoreData && !loadingMore && !isLoading) {
      setLoadingMore(true);
      // For subsequent loads, we want to load 3 items, so offset should be 1 + (n * 3)
      const nextOffset = currentOffset === 0 ? 1 : currentOffset + 3;
      setCurrentOffset(nextOffset);
    }
  };

  // Extract owner/repo from the first release URL if available
  const githubRepoUrl = allChangelogs[0]?.url
    ? allChangelogs[0].url.replace(
        "/releases/tag/" + allChangelogs[0].version,
        "/releases",
      )
    : null;

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
          {isLoading && currentOffset === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">
                Loading changelog...
              </span>
            </div>
          ) : allChangelogs.length > 0 ? (
            <>
              {allChangelogs.map((entry) => {
                // Show full content for all entries
                return (
                  <ChangelogEntry
                    key={entry.version}
                    entry={entry}
                    showFullContent={true}
                  />
                );
              })}

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
