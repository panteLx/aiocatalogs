export function parseChangelogContent(content: string): {
  importantNote?: string;
  features: string[];
  improvements: string[];
  bugfixes: string[];
  rawContent: string;
} {
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

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
