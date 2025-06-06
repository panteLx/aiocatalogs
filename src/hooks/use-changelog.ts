"use client";

import { useState, useEffect, useCallback } from "react";
import type { ParsedChangelogEntry, ChangelogProps } from "@/types/changelog";
import { api } from "@/trpc/react";
import { parseChangelogContent } from "@/lib/utils/changelog-utils";

export function useChangelog({ includePrerelease = false }: ChangelogProps) {
  const [allChangelogs, setAllChangelogs] = useState<ParsedChangelogEntry[]>(
    [],
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Initial load: 1 changelog, then 3 for each "Load More"
  const getItemsPerPage = useCallback(
    () => (currentOffset === 0 ? 1 : 3),
    [currentOffset],
  );

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
  }, [data, currentOffset, getItemsPerPage]);

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

  return {
    allChangelogs,
    loadingMore,
    hasLoadedInitial,
    hasMoreData,
    isLoading,
    error,
    githubRepoUrl,
    loadMoreChangelogs,
  };
}
