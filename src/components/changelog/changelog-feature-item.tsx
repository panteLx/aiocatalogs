import { MarkdownContent } from "./markdown-renderer";

export function ChangelogFeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary"></div>
      <div className="flex-1 text-sm">
        <MarkdownContent content={text} />
      </div>
    </div>
  );
}
