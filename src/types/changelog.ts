export interface ParsedChangelogEntry {
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

export interface ChangelogProps {
  includePrerelease?: boolean;
}
