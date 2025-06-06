import ReactMarkdown from "react-markdown";

// Custom Markdown content renderer with proper styling
export function MarkdownContent({ content }: { content: string }) {
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

  // Remove leading non-breaking spaces and regular spaces from headings
  modifiedContent = modifiedContent.replace(
    /^(#{1,6})\s+(&nbsp;|&#160;|\s)+/gm,
    "$1 ",
  );

  // Ensure list items have proper formatting with a space after the marker
  modifiedContent = modifiedContent.replace(
    /^(\s*)([*\-+]|(\d+\.))(\S)/gm,
    "$1$2 $4",
  );

  // Custom components for rendering specific markdown elements
  const components = {
    h1: ({ children }: React.HTMLProps<HTMLHeadingElement>) => {
      const cleanChildren =
        typeof children === "string"
          ? children.replace(/^(&nbsp;|&#160;|\s)+/g, "")
          : children;
      return <h1 className="text-2xl font-bold">{cleanChildren}</h1>;
    },
    h2: ({ children }: React.HTMLProps<HTMLHeadingElement>) => {
      const cleanChildren =
        typeof children === "string"
          ? children.replace(/^(&nbsp;|&#160;|\s)+/g, "")
          : children;
      return <h2 className="text-xl font-semibold">{cleanChildren}</h2>;
    },
    h3: ({ children }: React.HTMLProps<HTMLHeadingElement>) => {
      const cleanChildren =
        typeof children === "string"
          ? children.replace(/^(&nbsp;|&#160;|\s)+/g, "")
          : children;
      return <h3 className="text-lg font-medium">{cleanChildren}</h3>;
    },
    h4: ({ children }: React.HTMLProps<HTMLHeadingElement>) => {
      const cleanChildren =
        typeof children === "string"
          ? children.replace(/^(&nbsp;|&#160;|\s)+/g, "")
          : children;
      return <h4 className="text-base font-semibold">{cleanChildren}</h4>;
    },
    a: ({ href, children, ...props }: React.HTMLProps<HTMLAnchorElement>) => {
      const isGitHubUser =
        typeof href === "string" &&
        href.includes("https://github.com/") &&
        href.split("/").length === 4;

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

    code: ({
      inline,
      children,
      className,
      ...props
    }: React.HTMLProps<HTMLElement> & { inline?: boolean }) => {
      // Special handling for commit hashes in <samp> tags
      if (
        className === "language-samp" ||
        (inline && String(children).match(/^[a-f0-9]{5,7}$/))
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
    // List rendering
    ul: ({ children }: React.HTMLProps<HTMLUListElement>) => {
      return <ul className="my-2 list-disc space-y-1 pl-6">{children}</ul>;
    },
    ol: ({ children }: React.HTMLProps<HTMLOListElement>) => {
      return <ol className="my-2 list-decimal space-y-1 pl-6">{children}</ol>;
    },
    li: ({ children }: React.HTMLProps<HTMLLIElement>) => {
      return <li className="text-sm">{children}</li>;
    },
  };

  return (
    <div className="markdown-content prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown components={components}>{modifiedContent}</ReactMarkdown>
    </div>
  );
}
