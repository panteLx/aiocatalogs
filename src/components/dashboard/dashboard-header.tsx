interface DashboardHeaderProps {
  title: string;
  description: string;
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <div className="space-y-2 text-center">
      <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-4xl font-bold text-transparent">
        {title}
      </h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
