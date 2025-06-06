import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PageLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export function PageLayout({
  title,
  description,
  children,
  maxWidth = "md",
}: PageLayoutProps) {
  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case "sm":
        return "max-w-sm";
      case "md":
        return "max-w-md";
      case "lg":
        return "max-w-4xl";
      case "xl":
        return "max-w-6xl";
      case "2xl":
        return "max-w-7xl";
      case "full":
        return "max-w-full";
      default:
        return "max-w-md";
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 pt-16">
      {/* Main card */}
      <Card
        className={`pointer-events-auto relative z-10 w-full ${getMaxWidthClass()} border-border/50 bg-card/50 shadow-2xl backdrop-blur-xl`}
      >
        <CardHeader className="space-y-3 text-center">
          <CardTitle className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-2xl font-bold text-transparent">
            {title}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">{children}</CardContent>
      </Card>
    </main>
  );
}
