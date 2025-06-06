import { env } from "@/env";

// Client-side changelog configuration
export const changelogConfig = {
  // Display Settings
  display: {
    includePrerelease: env.NEXT_PUBLIC_GITHUB_INCLUDE_PRERELEASE === "true",
    showViewOnGitHubButton:
      env.NEXT_PUBLIC_GITHUB_SHOW_VIEW_ON_GITHUB_BUTTON === "true",
  },
} as const;

export type ChangelogConfig = typeof changelogConfig;
