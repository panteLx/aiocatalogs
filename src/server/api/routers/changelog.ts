import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { env } from "@/env";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import packageJson from "../../../../package.json";

// Helper function to get GitHub configuration from environment
function getGitHubConfig() {
  return {
    owner: env.GITHUB_REPO_OWNER,
    repo: env.GITHUB_REPO_NAME,
  };
}

// GitHub Release Schema
const GitHubReleaseSchema = z.object({
  id: z.number(),
  tag_name: z.string(),
  name: z.string().nullable(),
  body: z.string().nullable(),
  published_at: z.string(),
  html_url: z.string(),
  prerelease: z.boolean(),
  draft: z.boolean(),
});

// Our simplified Changelog Entry Schema
const ChangelogEntrySchema = z.object({
  version: z.string(),
  title: z.string(),
  content: z.string(),
  publishedAt: z.string(),
  url: z.string(),
  isPrerelease: z.boolean(),
});

type GitHubRelease = z.infer<typeof GitHubReleaseSchema>;
type ChangelogEntry = z.infer<typeof ChangelogEntrySchema>;

/**
 * Parse GitHub release body to extract structured changelog information
 */
function parseReleaseBody(body: string | null): {
  importantNote?: string;
  features: string[];
  bugfixes: string[];
  improvements: string[];
} {
  if (!body) {
    return { features: [], bugfixes: [], improvements: [] };
  }

  const result = {
    importantNote: undefined as string | undefined,
    features: [] as string[],
    bugfixes: [] as string[],
    improvements: [] as string[],
  };

  // Extract important notes (typically in bold or with [!IMPORTANT] tags)
  const importantMatch = body.match(/\[!IMPORTANT\][\s\S]*?(?=\n\n|$)/i);
  if (importantMatch) {
    result.importantNote = importantMatch[0]
      .replace(/\[!IMPORTANT\]\s*/i, "")
      .trim();
  }

  // Extract features section
  const featuresMatch = body.match(
    /##?\s*Features?\s*\n([\s\S]*?)(?=\n##|\n---|\n\*\*|$)/i,
  );
  if (featuresMatch?.[1]) {
    const featuresText = featuresMatch[1];
    const featureLines = featuresText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("*") || line.startsWith("-"))
      .map((line) => line.replace(/^[\*\-]\s*/, "").trim())
      .filter((line) => line.length > 0);
    result.features = featureLines;
  }

  // Extract bug fixes
  const bugfixMatch = body.match(
    /##?\s*(?:Bug\s*)?Fixes?\s*\n([\s\S]*?)(?=\n##|\n---|\n\*\*|$)/i,
  );
  if (bugfixMatch?.[1]) {
    const bugfixText = bugfixMatch[1];
    const bugfixLines = bugfixText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("*") || line.startsWith("-"))
      .map((line) => line.replace(/^[\*\-]\s*/, "").trim())
      .filter((line) => line.length > 0);
    result.bugfixes = bugfixLines;
  }

  // Extract improvements
  const improvementsMatch = body.match(
    /##?\s*Improvements?\s*\n([\s\S]*?)(?=\n##|\n---|\n\*\*|$)/i,
  );
  if (improvementsMatch?.[1]) {
    const improvementsText = improvementsMatch[1];
    const improvementLines = improvementsText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("*") || line.startsWith("-"))
      .map((line) => line.replace(/^[\*\-]\s*/, "").trim())
      .filter((line) => line.length > 0);
    result.improvements = improvementLines;
  }

  return result;
}

/**
 * Convert GitHub Release to our Changelog Entry format
 */
function convertReleaseToChangelogEntry(
  release: GitHubRelease,
): ChangelogEntry {
  const parsedBody = parseReleaseBody(release.body);

  // Create structured content
  let content = "";

  if (parsedBody.importantNote) {
    content += `[!IMPORTANT] ${parsedBody.importantNote}\n\n`;
  }

  if (parsedBody.features.length > 0) {
    content += "## Features\n";
    parsedBody.features.forEach((feature) => {
      content += `* ${feature}\n`;
    });
    content += "\n";
  }

  if (parsedBody.improvements.length > 0) {
    content += "## Improvements\n";
    parsedBody.improvements.forEach((improvement) => {
      content += `* ${improvement}\n`;
    });
    content += "\n";
  }

  if (parsedBody.bugfixes.length > 0) {
    content += "## Bug Fixes\n";
    parsedBody.bugfixes.forEach((bugfix) => {
      content += `* ${bugfix}\n`;
    });
    content += "\n";
  }

  // Fallback to raw body if no structured content found
  if (!content.trim() && release.body) {
    content = release.body;
  }

  return {
    version: release.tag_name.replace(/^v/, ""), // Remove 'v' prefix if present
    title: release.name ?? release.tag_name,
    content: content.trim(),
    publishedAt: release.published_at,
    url: release.html_url,
    isPrerelease: release.prerelease,
  };
}

export const changelogRouter = createTRPCRouter({
  /**
   * Get changelog entries from GitHub releases
   */
  getChangelog: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
        offset: z.number().min(0).default(0),
        includePrerelease: z.boolean().default(false),
      }),
    )
    .query(async ({ input }) => {
      try {
        const { limit, offset, includePrerelease } = input;
        const { owner, repo } = getGitHubConfig();

        // Prepare headers with optional GitHub token
        const headers: Record<string, string> = {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": `${packageJson.name}/${packageJson.version}`,
        };

        // Add authorization header if GitHub token is available
        const githubToken = process.env.GITHUB_TOKEN;
        if (githubToken) {
          headers.Authorization = `Bearer ${githubToken}`;
        }

        // Calculate how many releases we need to fetch from GitHub
        // We need to fetch more than needed because we might filter some out
        const fetchLimit = Math.min(100, (offset + limit) * 2); // GitHub max is 100 per page

        // Fetch releases from GitHub API
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/releases?per_page=${fetchLimit}`,
          { headers },
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: `Repository ${owner}/${repo} not found or releases are not accessible`,
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `GitHub API error: ${response.status} ${response.statusText}`,
          });
        }

        const releases: unknown[] = await response.json();

        // Validate and parse releases
        const validReleases = releases
          .map((release) => {
            try {
              return GitHubReleaseSchema.parse(release);
            } catch {
              return null;
            }
          })
          .filter((release): release is GitHubRelease => release !== null)
          .filter((release) => !release.draft) // Exclude draft releases
          .filter((release) => includePrerelease || !release.prerelease); // Filter prereleases if needed

        // Apply pagination after filtering
        const paginatedReleases = validReleases.slice(offset, offset + limit);

        // Convert to changelog entries
        const changelogEntries = paginatedReleases.map(
          convertReleaseToChangelogEntry,
        );

        return {
          entries: changelogEntries,
          total: changelogEntries.length,
          hasMore: validReleases.length > offset + limit,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Changelog fetch error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch changelog from GitHub",
          cause: error,
        });
      }
    }),

  /**
   * Get a specific release by tag
   */
  getRelease: publicProcedure
    .input(
      z.object({
        tag: z.string(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const { tag } = input;
        const { owner, repo } = getGitHubConfig();

        // Prepare headers with optional GitHub token
        const headers: Record<string, string> = {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": `${packageJson.name}/${packageJson.version}`,
        };

        // Add authorization header if GitHub token is available
        const githubToken = process.env.GITHUB_TOKEN;
        if (githubToken) {
          headers.Authorization = `Bearer ${githubToken}`;
        }

        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`,
          { headers },
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Release not found",
            });
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `GitHub API error: ${response.status} ${response.statusText}`,
          });
        }

        const release: unknown = await response.json();
        const validRelease = GitHubReleaseSchema.parse(release);

        return convertReleaseToChangelogEntry(validRelease);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Release fetch error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch release from GitHub",
          cause: error,
        });
      }
    }),
});

export type ChangelogRouter = typeof changelogRouter;
export type { ChangelogEntry };
