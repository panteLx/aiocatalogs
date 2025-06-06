interface SectionHeaderProps {
  title: string;
  description: string;
}

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="space-y-2 text-center">
      <h2 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-2xl font-bold text-transparent">
        {title}
      </h2>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
