// Client-side changelog configuration
export const changelogConfig = {
  // Display Settings
  display: {
    includePrerelease: false,
    showViewOnGitHubButton: true,
  },
} as const;

export type ChangelogConfig = typeof changelogConfig;
